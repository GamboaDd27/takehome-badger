from django.contrib import admin
from django.urls import path
from quotes.views import UploadCsvView, CsvResultListView, TaskStatusView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("upload-csv/", UploadCsvView.as_view()),
    path("results/", CsvResultListView.as_view()),
    path("tasks/<uuid:task_id>/", TaskStatusView.as_view()),
]
