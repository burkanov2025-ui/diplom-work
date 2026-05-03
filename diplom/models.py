from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    sponser_or_organizer = (('sponser', 'спонсор'),('organizer', 'организатор'))
    for_sponser_or_organizer = models.CharField(max_length=9, choices=sponser_or_organizer, blank=True, null=True)
    name_compani = models.CharField(max_length=250, blank=True, null=True)
    number = models.CharField(max_length=13, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    telegram = models.URLField(blank=True, null=True)
    
class It_Sponser(models.Model):
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organizer')
    title = models.CharField(max_length=255)
    img = models.ImageField(upload_to='sponsers/', blank=True, null=True)
    description = models.TextField(blank=True)
    kolvo_people = models.IntegerField()
    prezentation = models.FileField(upload_to='presentations/', blank=True, null=True)
    data_start = models.DateField()
    data_end = models.DateField()
    location = models.FloatField(blank=True, null=True)
    location2 = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sponsered = models.BooleanField(default=False)

    def __str__(self):                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
        return self.title
    
class SponsCommentaries(models.Model):
    itsponser = models.ForeignKey(It_Sponser, on_delete=models.CASCADE, related_name='commentaries')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="author")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Commenter {self.author}'

class SponsLikeforsponsers(models.Model):
    itsponser = models.ForeignKey(It_Sponser, on_delete=models.CASCADE, related_name='like')
    like = models.BooleanField(default=False)
    users = models.ForeignKey(User, on_delete=models.CASCADE, related_name="users")
    created_at = models.DateTimeField(auto_now_add=True)
    
class Sponsorotklik(models.Model):
    itsponser = models.ForeignKey(It_Sponser, on_delete=models.CASCADE, related_name='otklik')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="author_otklik")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)