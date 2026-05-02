from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):

    # model data
    queryset = Task.objects.all()

    # serializer file
    serializer_class = TaskSerializer


    # ===============================
    # Search / Filter Tasks
    # ===============================
    def get_queryset(self):

        tasks = Task.objects.all()

        search = self.request.GET.get("search")
        status = self.request.GET.get("status")
        priority = self.request.GET.get("priority")

        # Search in title
        if search:
            tasks = tasks.filter(title__icontains=search)

        # Filter status
        if status:
            tasks = tasks.filter(status=status)

        # Filter priority
        if priority:
            tasks = tasks.filter(priority=priority)

        return tasks


    # ===============================
    # Create Task
    # ===============================
    def create(self, request):

        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "Task Created",
                "data": serializer.data
            })

        return Response({
            "message": "Error",
            "errors": serializer.errors
        })


    # ===============================
    # Update Task
    # ===============================
    def update(self, request, pk=None):

        task = Task.objects.get(id=pk)

        serializer = TaskSerializer(task, data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "Task Updated",
                "data": serializer.data
            })

        return Response(serializer.errors)


    # ===============================
    # Delete Task
    # ===============================
    def destroy(self, request, pk=None):

        task = Task.objects.get(id=pk)
        task.delete()

        return Response({
            "message": "Task Deleted"
        })


    # ===============================
    # Stats API
    # ===============================
    @action(detail=False, methods=["get"])
    def stats(self, request):

        total = Task.objects.count()
        todo = Task.objects.filter(status="todo").count()
        progress = Task.objects.filter(status="in_progress").count()
        done = Task.objects.filter(status="done").count()

        return Response({
            "total": total,
            "todo": todo,
            "in_progress": progress,
            "done": done
        })
