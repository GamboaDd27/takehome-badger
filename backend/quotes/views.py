import uuid
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from celery.result import AsyncResult
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Quote, Part, QuoteLineItem

from .models import CsvResult
from .serializers import CsvResultSerializer
from .tasks import process_csv

class UploadCsvView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail":"No file uploaded (use form-data key 'file')."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Save to MEDIA_ROOT/csv_uploads/<uuid>.csv
        folder = Path("csv_uploads")
        folder_abs = Path(settings.MEDIA_ROOT) / folder
        folder_abs.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4()}.csv"
        rel_path = str(folder / name)
        with (Path(settings.MEDIA_ROOT) / rel_path).open("wb") as out:
            for chunk in file.chunks():
                out.write(chunk)

        # Enqueue Celery task
        async_result = process_csv.delay(rel_path)
        return Response({"task_id": async_result.id}, status=202)

class CsvResultListView(generics.ListAPIView):
    serializer_class = CsvResultSerializer

    def get_queryset(self):
        qs = CsvResult.objects.all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(stock_code__icontains=search)
        return qs

class TaskStatusView(APIView):
    def get(self, request, task_id, *args, **kwargs):
        task_id_str = str(task_id)
        res = AsyncResult(task_id_str)
        payload = {"task_id": task_id_str, "status": res.status}
        if res.status == "FAILURE":
            payload["error"] = str(res.result)
        return Response(payload)

class SeedDemoDataView(APIView):
    """
    Simple endpoint to seed demo Parts, Quotes, and LineItems.
    Only for testing/demo purposes.
    """

    def post(self, request, *args, **kwargs):
        # Avoid duplicate seeds by checking if already exists
        if Part.objects.exists() or Quote.objects.exists():
            return Response(
                {"detail": "Database already seeded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create Parts
        p1 = Part.objects.create(stock_code="AX123", description="Widget A")
        p2 = Part.objects.create(stock_code="BX456", description="Widget B")

        # Create Quotes
        q1 = Quote.objects.create(name="AxiomR_1", status=Quote.Status.APPROVED)
        q2 = Quote.objects.create(name="AxiomR_2", status=Quote.Status.APPROVED)

        # Create LineItems
        QuoteLineItem.objects.create(quote=q1, part=p1, quantity=5, price=10.50)
        QuoteLineItem.objects.create(quote=q1, part=p2, quantity=2, price=25.00)
        QuoteLineItem.objects.create(quote=q2, part=p1, quantity=1, price=12.00)

        return Response(
            {"detail": "Demo data seeded successfully."},
            status=status.HTTP_201_CREATED,
        )