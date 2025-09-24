from django.contrib import admin
from django.urls import path
from quotes.views import UploadCsvView, CsvResultListView, TaskStatusView, SeedDemoDataView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("upload-csv/", UploadCsvView.as_view()),
    path("results/", CsvResultListView.as_view()),
    path("tasks/<str:task_id>/", TaskStatusView.as_view()),
    path("seed-demo/", SeedDemoDataView.as_view()), 
]
