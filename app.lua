#!/usr/bin/env tarantool

-- Includes
local fiber = require('fiber')
local log = require('log')
local yaml = require('yaml')
local json = require('json')
local mraa = require('mraa')
local mqtt = require('mqtt')

box.cfg{
  slab_alloc_arena = 0.5;
  listen = 3301;
}
box.once('guest_grant', function()
    box.schema.user.grant('guest', 'read,write,execute', 'universe')
  end)
--
-- Create space & index
--
colors = box.schema.space.create('colors', {if_not_exists = true})
colors:create_index('pk', {parts={1, 'STR'}, if_not_exists = true})

word_filters = box.schema.space.create('word_filters', {if_not_exists = true})
word_filters:create_index('pk', {parts={1, 'STR'}, if_not_exists = true})

if box.space.colors:len() == 0 then
  require('./colors-db')
end
if box.space.word_filters:len() == 0 then
  require('./wordFilters-db')
end

print(yaml.encode(colors:select{}))
print(yaml.encode(word_filters:select{}))

local function say(msg)
  require('log').error(yaml.encode(msg))
end

function explode(div,str) -- credit: http://richard.warburton.it
  if (div=='') then return false end
  local pos,arr = 0,{}
  -- for each divider found
  for st,sp in function() return string.find(str,div,pos,true) end do
    table.insert(arr,string.sub(str,pos,st-1)) -- Attach chars left of current divider
    pos = sp + 1 -- Jump past current divider
  end
  table.insert(arr,string.sub(str,pos)) -- Attach chars right of last divider
  return arr
end

box.cfg {
  listen = '0.0.0.0:3301',
  log_level = 6,

  slab_alloc_arena = 0.5,
}

rgbLed = {
  busy = false,

  gamma_correction = 2.8,
  red_light = mraa.Pwm(3),
  green_light = mraa.Pwm(5),
  blue_light = mraa.Pwm(6),

  initialised = false,

  red_value = 0,
  green_value = 0,
  blue_value = 0,

  update = function(self)
    self.red_light:write(math.floor(255 * ((self.red_value/255) ^ self.gamma_correction) + 0.5) /255)
    self.green_light:write(math.floor(255 * ((self.green_value/255) ^ self.gamma_correction) + 0.5) /255)
    self.blue_light:write(math.floor(255 * ((self.blue_value/255) ^ self.gamma_correction) + 0.5) /255)
  end,

  off = function(self)
    self:init_once()
    self:color(0,0,0)
    self:update()
  end,

  on = function(self)
    self:init_once()
    self:color(255,255,255)
    self:update()
  end,

  color = function(self, red, green, blue)
    self:init_once()
    self.red_value = red
    self.green_value = green
    self.blue_value = blue
    self:update()
  end,

  migrate = function(self, red, green, blue, time)
    if(self.busy == true) then
      return
    end
    self.busy = true
    local toRed = red
    local toGreen = green
    local toBlue = blue
    local fromRed = self.red_value
    local fromGreen = self.green_value
    local fromBlue = self.blue_value
    local midRed = fromRed
    local midGreen = fromGreen
    local midBlue = fromBlue

    log.error(fromRed)
    log.error(fromGreen)
    log.error(fromBlue)
    log.error(toRed)
    log.error(toGreen)
    log.error(toBlue)

    local delay = time/100
    for i=1, 100, 1 do
      midRed = math.abs(midRed - (fromRed-toRed)/100)
      midGreen = math.abs(midGreen - (fromGreen-toGreen)/100)
      midBlue = math.abs(midBlue - (fromBlue-toBlue)/100)

      self:color(math.floor(midRed), math.floor(midGreen), math.floor(midBlue))
      fiber.sleep(delay)
    end
    self.busy = false
  end,

  pulse = function(self, delta, ppm)
    if (self.busy==true) then
      fiber.sleep(0.5)
      return self:pulse(delta,ppm)
    end
    local lowRed = self.red_value*delta/100
    local lowGreen = self.green_value*delta/100
    local lowBlue = self.blue_value*delta/100
    local highRed = self.red_value
    local highGreen = self.green_value
    local highBlue = self.blue_value

    local delay = 30/(100*ppm)
    for i=1, 100, 1 do
      if(self.red_value>0) then
        self.red_value = self.red_value - (highRed-lowRed)/100
      end

      if(self.green_value>0) then
        self.green_value = self.green_value - (highGreen-lowGreen)/100
      end

      if(self.blue_value>0) then
        self.blue_value = self.blue_value - (highBlue-lowBlue)/100
      end
      self:update()
      fiber.sleep(delay/2)
    end
    for i=1, 100, 1 do
      if(self.red_value~=0) then
        self.red_value = self.red_value + (highRed-lowRed)/100
      end

      if(self.green_value~=0) then
        self.green_value = self.green_value + (highGreen-lowGreen)/100
      end

      if(self.blue_value~=0) then
        self.blue_value = self.blue_value + (highBlue-lowBlue)/100
      end
      self:update()
      fiber.sleep(delay/2)
    end
  end,

  init_once = function(self)
    if not self.initialised then
      self.red_light:period_us(1)
      self.green_light:period_us(1)
      self.blue_light:period_us(1)

      self.red_light:enable(true)
      self.green_light:enable(true)
      self.blue_light:enable(true)

      self.initialised = true
    end
  end
}

conn = mqtt.new()

ok, msg = conn:on_message(function(mid, topic, payload)
    local colors = explode(" ", payload)
    rgbLed:migrate(colors[1], colors[2], colors[3], 2)
  end)

ok, msg = conn:connect({host="0.0.0.0", port=1883})

ok, emsg = conn:subscribe('devices/rgbLed/set')

local function rgbLedTest()
  while true do
    rgbLed:pulse(60,15)
  end
end

local function sendRandomColor()
  while true do
    ok, emsg = conn:publish("devices/rgbLed/set", math.random(0,255) .. " " .. math.random(0,255) .. " " ..
      math.random(0,255))
    fiber.sleep(5)
  end
end

fiber.create(rgbLedTest)
-- fiber.create(sendRandomColor)
