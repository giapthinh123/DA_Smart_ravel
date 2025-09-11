from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Users
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UserSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Get user profile"""
        user = get_object_or_404(Users, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def admins(self, request):
        """Get all admin users"""
        admin_users = Users.objects.filter(is_admin=1)
        serializer = UserSerializer(admin_users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def make_admin(self, request, pk=None):
        """Make user an admin"""
        user = get_object_or_404(Users, pk=pk)
        user.is_admin = 1
        user.save()
        return Response({'status': 'User is now an admin'})

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users by name or email"""
        query = request.query_params.get('q', '')
        if query:
            users = Users.objects.filter(
                name__icontains=query
            ) | Users.objects.filter(
                email__icontains=query
            )
        else:
            users = Users.objects.all()
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)