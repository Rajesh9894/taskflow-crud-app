from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):  #viewset provide buildin 

    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

    # SEARCH / FILTER
    def get_queryset(self):    #dynamic filtering based on query parameters
        tasks = Task.objects.all()

        search = self.request.GET.get("search")
        status_param = self.request.GET.get("status")
        priority = self.request.GET.get("priority")

        if search:
            tasks = tasks.filter(title__icontains=search)

        if status_param:
            tasks = tasks.filter(status=status_param)

        if priority:
            tasks = tasks.filter(priority=priority)

        return tasks

    # CREATE

    def create(self, request, *args, **kwargs):
        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Task Created",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "message": "Error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


  
    # UPDATE

    def update(self, request, *args, **kwargs):
        task = self.get_object()

        serializer = TaskSerializer(task, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Task Updated",
                "data": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    
    # DELETE

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        task.delete()

        return Response({
            "message": "Task Deleted"
        }, status=status.HTTP_204_NO_CONTENT)



    # STATS API
   
    @action(detail=False, methods=["get"])
    def stats(self, request):
        return Response({
            "total": Task.objects.count(),
            "todo": Task.objects.filter(status="todo").count(),
            "in_progress": Task.objects.filter(status="in_progress").count(),
            "done": Task.objects.filter(status="done").count(),
        })