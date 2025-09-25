import csv
from decimal import Decimal
from pathlib import Path

from celery import shared_task
from django.conf import settings
from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import CsvResult, QuoteLineItem


def _ws_send(task_id: str, status: str, payload: dict | None = None):
    """
    Push a message to the WebSocket group for this task.
    The consumer should define `task_update` to handle these.
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        f"task_{task_id}",
        {
            "type": "task.update",  # -> calls TaskConsumer.task_update
            "status": status,
            "task_id": str(task_id),
            "result": payload or {},
        },
    )


@shared_task(bind=True)
def process_csv(self, relative_csv_path: str):
    """
    relative_csv_path is relative to MEDIA_ROOT, e.g. "csv_uploads/<uuid>.csv"
    Emits WebSocket updates on STARTED / SUCCESS / FAILURE to group: task_<task_id>.
    """
    task_id = str(self.request.id)
    try:
        # --- notify STARTED
        _ws_send(task_id, "STARTED", {"message": "Processing started"})

        # --- locate CSV
        csv_path = Path(settings.MEDIA_ROOT) / relative_csv_path
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV not found: {csv_path}")

        # --- read & validate
        with csv_path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            if "stock_code" not in (reader.fieldnames or []):
                raise ValueError("CSV must include 'stock_code' column.")

            codes: set[str] = set()
            for row in reader:
                code = (row.get("stock_code") or "").strip()
                if code:
                    codes.add(code)

        if not codes:
            result = {"created": 0, "message": "No stock_code values present."}
            _ws_send(task_id, "SUCCESS", result)
            return result

        # --- aggregate by stock_code
        agg = (
            QuoteLineItem.objects.filter(part__stock_code__in=codes)
            .values("part__stock_code")
            .annotate(
                number_quotes_found=Count("id"),
                total_price=Coalesce(Sum("price"), Value(Decimal("0.00"))),
            )
        )
        agg_map = {a["part__stock_code"]: a for a in agg}

        # --- build results (include zero-hit codes)
        results = []
        for code in codes:
            rec = agg_map.get(code)
            count_ = rec["number_quotes_found"] if rec else 0
            total_ = rec["total_price"] if rec else Decimal("0.00")
            results.append(
                CsvResult(
                    stock_code=code,
                    number_quotes_found=count_,
                    total_price=total_,
                    file_uploaded=str(relative_csv_path),
                )
            )

        CsvResult.objects.bulk_create(results, batch_size=500)

        # --- notify SUCCESS
        # Convert Decimals to str so the frontend doesn't get NaN on parse
        summary = {
            "created": len(results),
            "codes": sorted(codes)[:25],  # preview up to 25 codes
        }
        _ws_send(task_id, "SUCCESS", summary)
        return {"created": len(results)}

    except Exception as exc:
        # --- notify FAILURE with error message
        _ws_send(task_id, "FAILURE", {"error": str(exc)})
        # Re-raise so Celery marks the task as FAILURE in the result backend too
        raise
