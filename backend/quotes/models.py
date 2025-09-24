from django.db import models

class Quote(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "pending"
        APPROVED = "approved", "approved"
        REJECTED = "rejected", "rejected"

    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.name

class Part(models.Model):
    stock_code = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self): return self.stock_code

class QuoteLineItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="line_items")
    part  = models.ForeignKey(Part, on_delete=models.CASCADE, related_name="line_items")
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self): return f"{self.part.stock_code} x{self.quantity} @{self.price}"

class CsvResult(models.Model):
    stock_code = models.CharField(max_length=100)
    number_quotes_found = models.PositiveIntegerField(default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    file_uploaded = models.FileField(upload_to="csv_uploads/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["stock_code", "-created_at"])]
        ordering = ["-created_at"]
