from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
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
    @action(detail=False, methods=['get'])
    def check_admin(self, request):
        """Check if user is admin"""
        # For now, return True to allow access for testing
        # TODO: Implement proper authentication check
        # return Response({'is_admin': True})
        
        # Proper implementation would be:
        if hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'is_admin') and request.user.is_admin:
                return Response({'is_admin': True})
        return Response({'is_admin': False})


class AuthLoginView(APIView):
    """Handle user login"""
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = Users.objects.get(email=email)
            # For now, simple password check (in production, use proper hashing)
            if user.password == password:  # TODO: Use proper password hashing
                return Response({
                    'success': True,
                    'data': {
                        'user': UserSerializer(user).data,
                        'token': f'fake_token_{user.user_id}'  # TODO: Use real JWT
                    }
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
        except Users.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)


class AuthRegisterView(APIView):
    """Handle user registration"""
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'success': True,
                'data': {
                    'user': UserSerializer(user).data,
                    'token': f'fake_token_{user.user_id}'  # TODO: Use real JWT
                }
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'message': 'Registration failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class AuthLogoutView(APIView):
    """Handle user logout"""
    def post(self, request):
        # Since we're using token-based auth, just return success
        # In real implementation, would invalidate token
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })


class AuthMeView(APIView):
    """Get current user profile"""
    def get(self, request):
        # TODO: Implement proper authentication check
        # For now, return mock user
        return Response({
            'success': True,
            'data': {
                'user_id': '1',
                'name': 'Test User',
                'email': 'test@example.com',
                'is_admin': True
            }
        })