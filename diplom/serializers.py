from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *
from datetime import date

class sponserializer(serializers.ModelSerializer):
    class Meta:
        model = It_Sponser
        fields = '__all__'
        read_only_fields = ['organizer']

        def validate(self, data):
            if data['data_start'] > data['data_end']:
                raise serializers.ValidationError("дата начале должно быть меньше даты окончания")
            if data['data_start'] < date.today():
                raise serializers.ValidationError("дата начала не может быть в прошлом")
            if data['data_end'] < date.today():
                raise serializers.ValidationError("дата окончания не может быть в прошлом")
            
            if data['kolvo_people'] is None or data['kolvo_people'] < 0:
                raise serializers.ValidationError("количество людей должен быть больше 0")
            
            if data['img'] == None:
                raise serializers.ValidationError("изображение должно быть загружено")
            if data['img'] and data['img'] .size > 2 * 1024 * 1024:
                raise serializers.ValidationError("размер изображения не должен превышать 2 МБ")
            
            if data['prezentation'] and data['prezentation'].size > 20 * 1024 * 1024:
                raise serializers.ValidationError("размер презентации не должен превышать 20 МБ")
            
            if data['title'] == None:
                raise serializers.ValidationError("название должно быть заполнено")
            
            if data['description'] == None:
                raise serializers.ValidationError("описание должно быть заполнено")
            
            return data
            
        def validate_location(self, value):
            if value is not None and (value < -90 or value > 90):
                raise serializers.ValidationError("Широта должна быть в диапазоне от -90 до 90")
            return value
        
        def validate_kolvo_people(self, value):
            if value < 0:
                raise serializers.ValidationError("Количество людей не может быть ниже 0")
            return value

class commentlizer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = SponsCommentaries
        fields = "__all__"
        read_only_fields = ['author']

        def validate(self, data):
            if not data.get('text'):
                raise serializers.ValidationError("Текст должен быть заполнен")
            return data

class lizer(serializers.ModelSerializer):
    class Meta:
        model = SponsLikeforsponsers
        fields = "__all__"
        read_only_fields = ['users']

class Regserializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    def validate(self, data):
        if data['instagram'] and 'https://www.instagram.com/' not in data['instagram']:
            raise serializers.ValidationError('ссылка на инстаграм должна начинаться с https://www.instagram.com')
        
        if data['telegram'] and 'https://t.me/' not in data['telegram']:
            raise serializers.ValidationError('ссылка на телеграм не верная')
        
        if data['website'] and not (data['website'].startswith('http://') or data['website'].startswith('https://')):
            raise serializers.ValidationError('ссылка на сайт должна начинаться с http:// или https://')
        
        if data['number'] and not data['number'][1:].isdigit():
            raise serializers.ValidationError('номер должен содержать только цифры')
        
        if data['number'] and len(data['number']) <= 10:
            raise serializers.ValidationError('номер должен содержать не менее 10 цифр')
        return data

class Profileserializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class sponserotklikserializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_name_compani = serializers.CharField(source='author.name_compani', read_only=True)
    author_website = serializers.CharField(source='author.website', read_only=True)
    author_telegram = serializers.CharField(source='author.telegram', read_only=True)
    author_instagram = serializers.CharField(source='author.instagram', read_only=True)
    author_number = serializers.CharField(source='author.number', read_only=True)

    class Meta:
        model = Sponsorotklik
        fields = ["author_username", "id","author_name_compani", "author_website", "author_telegram", "author_instagram", "author_number", "text", "created_at", "itsponser"]
        read_only_fields = ['author']
    
    def validate(self, data):
        if not data.get('text'):
            raise serializers.ValidationError("Текст должен быть заполнен")
        return data
