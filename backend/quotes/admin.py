from django.contrib import admin

from .models import Quote, Part, QuoteLineItem, CsvResult
admin.site.register([Quote, Part, QuoteLineItem, CsvResult])