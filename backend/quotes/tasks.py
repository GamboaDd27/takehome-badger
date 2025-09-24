import csv
from decimal import Decimal
from pathlib import Path
from celery import shared_task
from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce
from django.conf import settings
from .models import CsvResult, QuoteLineItem

@shared_task(bind=True)
def process_csv(self, relative_csv_path: str):
    """
    relative_csv_path is relative to MEDIA_ROOT, e.g. "csv_uploads/<uuid>.csv"
    """
    csv_path = Path(settings.MEDIA_ROOT) / relative_csv_path
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    # 1) Read & validate header
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if "stock_code" not in (reader.fieldnames or []):
            raise ValueError("CSV must include 'stock_code' column.")

        codes = set()
        for row in reader:
            code = (row.get("stock_code") or "").strip()
            if code:
                codes.add(code)

    if not codes:
        return {"created": 0, "message": "No stock_code values present."}

    # 2) Aggregate line items by stock_code
    agg = (
        QuoteLineItem.objects.filter(part__stock_code__in=codes)
        .values("part__stock_code")
        .annotate(
            number_quotes_found=Count("id"),
            total_price=Coalesce(Sum("price"), Value(Decimal("0.00")))
        )
    )
    agg_map = {a["part__stock_code"]: a for a in agg}

    # 3) Prepare bulk CsvResult (include zero-hit codes)
    results = []
    for code in codes:
        rec = agg_map.get(code)
        count_ = rec["number_quotes_found"] if rec else 0
        total_ = rec["total_price"] if rec else Decimal("0.00")
        results.append(CsvResult(
            stock_code=code,
            number_quotes_found=count_,
            total_price=total_,
            file_uploaded=str(relative_csv_path),  # set file path string
        ))

    CsvResult.objects.bulk_create(results, batch_size=500)
    return {"created": len(results)}
