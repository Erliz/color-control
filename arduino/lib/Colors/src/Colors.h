#ifndef Colors_h
#define Colors_h

#include "Arduino.h"

class Colors
{
  public:
    Colors(int, String, int);
    static const int MAX_VALUE;
    static const int MIN_VALUE;
    void setValue(int);
    void wantValue(int);
    String getColor();
    int getValue();
    int getWantedValue();
    void tick();
  private:
    void migrate();
    String    _color;
    int       _currentValue;
    int       _pin;
    unsigned  _step;
    int       _wantedValue;
    // pulse
    void pulse();
    bool      _isPulsing;
    int       _pulseValue;
    unsigned  _pulseStep;
    bool      _isPulseRaise;
    unsigned  _pulseDelay;
    unsigned  _pulseTickCount;
    unsigned  _pulseRange;
};

#endif
