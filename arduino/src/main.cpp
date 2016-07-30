// #include <string.h>
#include <Arduino.h>
#include <Colors.h>

#define COLORS_COUNT 3

int minLedValue = 0;
int maxLedValue = 255;

String RED_COLOR = "red";
String GREEN_COLOR = "green";
String BLUE_COLOR = "blue";

int redLedPin = 3;
int greenLedPin = 5;
int blueLedPin = 6;

int redLedValue = 0;
int greenLedValue = 0;
int blueLedValue = 0;

bool isRedLedBuzy = false;
bool isGreenLedBuzy = false;
bool isBlueLedBuzy = false;

Colors RedColor(redLedPin, RED_COLOR, 20);
Colors GreenColor(greenLedPin, GREEN_COLOR, 20);
Colors BlueColor(blueLedPin, BLUE_COLOR, 20);

void setup() {
  Serial.begin(9600);
  Serial.println("Enter 'color:value' to show the magic");

  // pinMode(redLedPin, OUTPUT);
  // pinMode(greenLedPin, OUTPUT);
  // pinMode(blueLedPin, OUTPUT);
}

void setLedValue(int ledPin, int value) {
  Serial.print("Value: "); Serial.println(value);
  analogWrite(ledPin, value);
}

void setLedValueToMax(int ledPin, int &ledValue) {
  ledValue = maxLedValue;
  setLedValue(ledPin, ledValue);
}

void setLedValueToMin(int ledPin, int &ledValue) {
  ledValue = minLedValue;
  setLedValue(ledPin, ledValue);
}

void modifyLedValue(int ledPin, int &ledValue, bool increase = true, int step = 1) {
  ledValue = ledValue + (increase ? step : step * -1);
  setLedValue(ledPin, ledValue);
}

void loop() {
  if (Serial.available()) {
    String serialData = Serial.readStringUntil('\n');
    Serial.print("Data from searial: "); Serial.println(serialData);
    char colorDelimeter = '|';
    char colorValueDelimeter = ':';
    String rawData = serialData;
    String colorData[COLORS_COUNT];
    int i = 0;
    while (rawData.length()) {
      int colorDelimeterIndex = rawData.indexOf(colorDelimeter);
      if (colorDelimeterIndex >= 0) {
        colorData[i] = rawData.substring(0, colorDelimeterIndex);
        rawData = rawData.substring(colorDelimeterIndex + 1);
      } else {
        colorData[i] = rawData;
        rawData = String("");
      }
      i++;
    }
    for (i = 0; i < COLORS_COUNT; i++) {
      int colorValueDelimeterIndex = colorData[i].indexOf(colorValueDelimeter);
      String ledColor = colorData[i].substring(0, colorValueDelimeterIndex);
      int ledValue = colorData[i].substring(colorValueDelimeterIndex + 1).toInt();
      // Serial.println(ledColor);
      // Serial.println(ledValue);
      if (ledColor == RED_COLOR) {
        RedColor.wantValue(ledValue);
      } else if (ledColor == GREEN_COLOR){
        GreenColor.wantValue(ledValue);
      } else if (ledColor == BLUE_COLOR) {

        BlueColor.wantValue(ledValue);
      }else{
        Serial.println("Unknown color token");
      }
      // =====
      // int ledPin;
      // if (ledColor == RED_COLOR) {
      //   ledPin = redLedPin;
      // } else if (ledColor == GREEN_COLOR){
      //   ledPin = greenLedPin;
      // } else if (ledColor == BLUE_COLOR) {
      //   ledPin = blueLedPin;
      // }else{
      //   Serial.println("Unknown color token");
      // }
      // Serial.print("Color: "); Serial.println(ledColor);
      // setLedValue(ledPin, ledValue);
    }
  }
  RedColor.tick();
  GreenColor.tick();
  BlueColor.tick();
}
