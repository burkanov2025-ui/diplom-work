from django.shortcuts import get_object_or_404, render
from rest_framework import status
from rest_framework.authtoken.views import obtain_auth_token
import os
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import *
from .models import *
from django.dispatch import receiver
from django.db.models.signals import post_delete

class IsOrganizer(BasePermission):
    def has_permission(self, request, view):
        return request.user.for_sponser_or_organizer == "organizer"


class IsSponser(BasePermission):
    def has_permission(self, request, view):
        return request.user.for_sponser_or_organizer == "sponser"


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.organizer == request.user


class It_SponserForuser(APIView):
    permission_map = {
        'GET': [AllowAny],
        'POST': [IsAuthenticated, IsOrganizer],
    }

    def get_permissions(self):
        return [permission() for permission in self.permission_map.get(self.request.method, [IsAuthenticated])]

    def get(self, request):
        sponsers = It_Sponser.objects.select_related("organizer")
        filtr_id = request.query_params.get('organizer')
        if filtr_id == 'me' and request.user.is_authenticated:
            sponsers = sponsers.filter(organizer=request.user)
            
        serial = sponserializer(sponsers, many=True)
        return Response(serial.data)

    def post(self, request):
        serial = sponserializer(data=request.data)
        if serial.is_valid():
            serial.save(organizer=request.user)
            return Response(serial.data, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)

class sponserotklikview1(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        otklik = Sponsorotklik.objects.select_related("author")
        if request.user.is_authenticated and request.user.for_sponser_or_organizer == "organizer":
            otklik = otklik.filter(itsponser__organizer=request.user)
        serial = sponserotklikserializer(otklik, many=True)
        return Response(serial.data)


class sponserotklikview(APIView):
    permission_classes = [IsAuthenticated, IsSponser]

    def post(self, request, pk):
        sponser = get_object_or_404(It_Sponser, id=pk)
        serial = sponserotklikserializer(data=request.data)
        model_proverka = Sponsorotklik.objects.filter(author_id=request.user.id, itsponser_id=pk)
        spisok = [i for i in model_proverka.values_list("author_id", flat=True)]
        if not serial.is_valid():
            return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)
        if sponser.id != serial.validated_data.get("itsponser").id:
            return Response(
                {"itsponser": ["Неверный идентификатор мероприятия"]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # if sponser.organizer_id == request.user.id:
        if request.user.id not in spisok:
            serial.save(author=request.user)
            return Response(serial.data, status=status.HTTP_201_CREATED)
        else:
            return Response("отклик уже оставлен", status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        otklik = get_object_or_404(Sponsorotklik, id=pk)
        if otklik.author_id == request.user.id:
            otklik.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response("оно вам не принадлежит", status=status.HTTP_404_NOT_FOUND)


class Sponsdel(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        spons = get_object_or_404(It_Sponser, id=pk)
        if spons.organizer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serial = sponserializer(spons, data=request.data, partial=True)
        if serial.is_valid():
            print(spons, serial.validated_data.get("description"))
            if serial.validated_data.get("prezentation"):
                if spons.prezentation and os.path.isfile(spons.prezentation.path):
                    os.remove(spons.prezentation.path)
                    serial.save()
            else:
                serial.save()
            return Response(serial.data, status=status.HTTP_200_OK)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        spons = get_object_or_404(It_Sponser, id=pk)
        if spons.organizer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        spons.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@receiver(post_delete, sender=It_Sponser)
def Auto_del_photos(sender, instance, **kwargs):
    if instance.img:
        if os.path.isfile(instance.img.path) and os.remove(instance.img.path):
            os.remove(instance.img.path)
    if instance.prezentation:
        if os.path.isfile(instance.prezentation.path) and os.remove(instance.prezentation.path):
            os.remove(instance.prezentation.path)

class Commentuser(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get(self, request):
        commentuser = SponsCommentaries.objects.select_related("author", "itsponser")
        com_liz = commentlizer(commentuser, many=True)
        return Response(com_liz.data)

    def post(self, request):
        serila = commentlizer(data=request.data)
        if serila.is_valid():
            serila.save(author=request.user)
            return Response(serila.data, status=status.HTTP_201_CREATED)
        return Response(serila.errors, status=status.HTTP_400_BAD_REQUEST)


class commentdel(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def delete(self, request, pk):
        comm = get_object_or_404(SponsCommentaries, id=pk)
        if comm.author_id == request.user.id:
            comm.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response("нельзя удалять чужое сообщение", status=status.HTTP_404_NOT_FOUND)


class likes(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get(self, request):
        like_model = SponsLikeforsponsers.objects.select_related("users", "itsponser")
        serial = lizer(like_model, many=True)
        return Response(serial.data)

    def post(self, request):
        serial = lizer(data=request.data)
        # model_proverka = SponsLikeforsponsers.objects.all().values("users_id")
        if SponsLikeforsponsers.objects.filter(itsponser_id=request.data.get("itsponser"), users=request.user).exists():
            return Response("Лайк уже поставлен", status=status.HTTP_400_BAD_REQUEST)
        if serial.is_valid():
                serial.save(users=request.user)
                return Response(serial.data, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)


class likedel(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def delete(self, request, pk):
        delike = get_object_or_404(SponsLikeforsponsers, id=pk)
        print(delike.like)
        if delike.users_id == request.user.id:
            delike.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response("don't very good", status=status.HTTP_404_NOT_FOUND)


class registrated(APIView):
    def post(self, request):
        serial = Regserializer(data=request.data)
        if serial.is_valid():
            serial.save()
            return Response(serial.data, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)


class loginsession(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"users": request.user.username})


class userviews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        model_user = User.objects.all()
        serial = UserSerializer(model_user, many=True)
        return Response(serial.data)


class profile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serial = Profileserializer(request.user)
        return Response(serial.data)


class profile_update(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serial = Profileserializer(request.user, data=request.data, partial=True)
        if serial.is_valid():
            serial.save()
            return Response(serial.data)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)


def index(request):
    return render(request, "index.html")


def registration(request):
    return render(request, "registration.html")


def login(request):
    return render(request, "login.html")


def sponsers(request):
    return render(request, "sponsers.html")


def sponser_menu(request):
    return render(request, "sponser_menu.html")


def profile1(request):
    return render(request, "profile.html")


def profile_updatehtml(request):
    return render(request, "profile_update.html")


def user_page(request):
    return render(request, "users.html")

def otklik(request):
    return render(request, "otklik.html")