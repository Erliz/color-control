#include "Arduino.h"
#include "Colors.h"

const int Colors::MIN_VALUE = 0;
const int Colors::MAX_VALUE = 255;

Colors::Colors(int pin, String color, int step)
{
  pinMode(pin, OUTPUT);
  _color = color;
  _pin = pin;
  _step = unsigned(step);
  _currentValue = MIN_VALUE;
  _wantedValue = _currentValue;

  _pulseValue = 0;
  _pulseStep = 1;
  _pulseRange = 50;
  _pulseDelay = 200;
  _pulseTickCount = 0;
  _isPulsing = false;
}

void Colors::setValue(int value) {
  analogWrite(_pin, value);
  _currentValue = value;
}

String Colors::getColor() {
  return _color;
}

int Colors::getValue() {
  return _currentValue;
}

int Colors::getWantedValue() {
  return _wantedValue;
}

void Colors::wantValue(int value) {
  // Serial.print("Want :");Serial.println(value);
  _wantedValue = value;
}

void Colors::migrate() {
  if (_wantedValue == _currentValue) {
    return;
  }

  int diff = _currentValue - _wantedValue;
  int sign = diff > 0 ? -1 : 1;
  int step = abs(diff) > _step ? _step : abs(diff);

  setValue(getValue() + step * sign);
}

void Colors::pulse() {
  // Serial.print(getColor());Serial.print("_value_");Serial.println(getValue());
  // Serial.print(getColor());Serial.print("_wantedValue_");Serial.println(getWantedValue());

  if (_currentValue == MIN_VALUE || _wantedValue != _currentValue) {
    return;
  }
  // Serial.print(getColor());Serial.print("_pulseTickCount");Serial.println(_pulseTickCount);

  if (_pulseTickCount == 0 || _pulseTickCount % _pulseDelay != 0) {
    _pulseTickCount++;
    return;
  }
  // Serial.print("Tick count ");Serial.print(getColor());Serial.print(" ");Serial.println(_pulseTickCount);
  _pulseTickCount = 0;
  _pulseValue = _pulseValue + (_pulseStep * (_isPulseRaise ? 1 : -1));

  // Serial.print("Pulse value: ");Serial.println(_pulseValue);
  // Serial.print("_isPulseRaise: ");Serial.println(_isPulseRaise ? "true" : "false");

  int newValue = getValue() + _pulseValue;
  // Serial.print("newValue: ");Serial.println(newValue);

  if (newValue > MAX_VALUE || newValue < MIN_VALUE) {
    // Serial.print("Max or min value hit: ");Serial.println(newValue);
    _isPulseRaise = !_isPulseRaise;
    // Serial.print("Change pulse raise to: ");Serial.println(_isPulseRaise ? "true" : "false");

    return;
  }
  analogWrite(_pin, newValue);
  if (abs(_pulseValue) >= _pulseRange) {
    _isPulseRaise = !_isPulseRaise;
    // Serial.print("Change pulse raise to: ");Serial.println(_isPulseRaise ? "true" : "false");
  }
}

void Colors::tick() {
  migrate();
  // pulse();
}
