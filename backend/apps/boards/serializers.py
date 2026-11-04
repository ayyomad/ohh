"""Serializer/validation rules for boards.

Key rules (why):
- owner/deleted_at are simply NOT fields here, so a hostile payload touching
  them is ignored, never accepted; the view assigns the owner from the seam.
- settings is validated as a WHOLE object every time it appears: DRF would
  otherwise silently ignore unknown keys, and DRF would also propagate
  partial=True into the nested serializer, letting a PATCH sneak in one key
  and drift the stored value.
"""

from rest_framework import serializers

from apps.boards.models import Board

ALLOWED_APPEARANCE = ("light", "dark")
ALLOWED_BACKGROUND = ("plain", "grid", "dots")
ALLOWED_SETTINGS_KEYS = {"appearance", "background"}


class BoardSettingsSerializer(serializers.Serializer):
    appearance = serializers.ChoiceField(choices=ALLOWED_APPEARANCE)
    background = serializers.ChoiceField(choices=ALLOWED_BACKGROUND)

    def to_internal_value(self, data):  # type: ignore[override]
        if not isinstance(data, dict):
            raise serializers.ValidationError("Settings must be an object.")
        unknown = sorted(set(data) - ALLOWED_SETTINGS_KEYS)
        for key in unknown:
            raise serializers.ValidationError({key: "Unknown key."})
        missing = sorted(ALLOWED_SETTINGS_KEYS - set(data))
        # Explicit missing-key check: the nested serializer inherits
        # partial=True from PATCH, which would drop the requirement.
        errors: dict[str, str] = {}
        for key in missing:
            errors[key] = "This field is required."
        if errors:
            raise serializers.ValidationError(errors)
        return super().to_internal_value(data)


class BoardSerializer(serializers.ModelSerializer):
    settings = BoardSettingsSerializer(required=False)

    class Meta:
        model = Board
        fields = ("id", "title", "description", "settings", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    description = serializers.CharField(max_length=2000, required=False, allow_blank=True)

    def validate_title(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Title must not be blank.")
        return trimmed

    def create(self, validated_data):
        # settings omitted -> model default; settings given -> full replacement.
        validated_data = self._apply_settings(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # PATCH without settings must leave the stored settings untouched.
        validated_data = self._apply_settings(validated_data)
        return super().update(instance, validated_data)

    def _apply_settings(self, validated_data):
        settings_data = validated_data.pop("settings", None)
        if settings_data is not None:
            validated_data["settings"] = settings_data
        return validated_data
