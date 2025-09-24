from rest_framework import serializers
from .models import CsvResult

class CsvResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CsvResult
        fields = ["stock_code","number_quotes_found","total_price","created_at"]
