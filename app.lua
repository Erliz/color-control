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
--
-- Create space & index
--
colors = box.schema.space.create('colors', {if_not_exists = true})
colors:create_index('pk', {parts={1, 'STR'}, if_not_exists = true})

word_filters = box.schema.space.create('word_filters', {if_not_exists = true})
word_filters:create_index('pk', {parts={1, 'STR'}, if_not_exists = true})

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
if box.space.word_filters:len() == 0 then
  require('./wordFilters-db')
end

print(yaml.encode(colors:select{}))
print(yaml.encode(word_filters:select{}))
