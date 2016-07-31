#!/usr/bin/env tarantool

-- Includes
local fiber = require('fiber')
local log = require('log')
local yaml = require('yaml')
local json = require('json')
local io = require('io')
box.cfg{
  slab_alloc_arena = 0.5;
  listen = 3301;
}
 -- box.schema.user.grant('guest', 'read,write,execute', 'universe')
function inArray(needle, array)
  local valid = {}
  for i = 1, #array do
   valid[array[i]] = true
  end
  if valid[needle] then
   return false
  else
   return true
  end
end

function getColors()
  return {{colors:select{}}}
end

function addColors(words, colorsList)
  for _, wordValue in pairs(words) do
    local existValues = colors:get{wordValue}
    print(yaml.encode(existValues))
    for _, colorValue in pairs(colorsList) do

      if inArray(colorValue, existValues) then
        colors:update{wordValue, {colorValue}}
      else
        colors:insert{wordValue, {colorValue}}
      end
    end
  end
end
--
-- Create space & index
--
colors = box.schema.space.create('colors', {if_not_exists = true})

-- SQL Analogue:
-- CREATE INDEX pk ON tester(first_col)
colors:create_index('pk', {parts={1, 'STR'}, if_not_exists = true})

-- SQL Analogue:
-- CREATE INDEX pk ON tester(second_col)
--
--colors:insert{'a',
--{
--{234,30,100},
--{40,50,60},
--{100,200,255}
--}}

--colors:insert{'b',
--{234,30,100},
--{40,50,60},
--{100,200,255}
--}

--colors:insert{'c',
--{234,30,100},
--{40,50,60},
--{100,200,255}
--}
if box.space.colors:len() == 0 then
  require('./colors-db')
end

print(box.space.colors:len())
print(yaml.encode(colors:select{}))
