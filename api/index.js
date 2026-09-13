// server.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import crypto from "crypto";

// src/db/index.ts
import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// src/data/initialGames.ts
var INITIAL_GAMES = [
  {
    "id": "game-doors",
    "universeId": 2440500124,
    "rootPlaceId": 6516141723,
    "name": "DOORS \u{1F454}",
    "description": "\u{1F454} PLAY THE ARCHIVES NOW! \u{1F454}  A horror game involving doors.  We recommend entering without a guide; use each death as a lesson. \u26A0\uFE0F Loud sounds, flashing lights ahead! \u{1F3A7} \u{1F4F7} Headphones & max graphics recommended  \u2764\uFE0F Join the LSPLASH group for a free Revive! \u2B50 Buy (and wear) our UGC for some Knobs an",
    "creatorName": "LSPLASH",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 71494,
    "totalVisits": "7.7B+",
    "rawVisits": 7701104387,
    "favoritedCount": 8145372,
    "upVotes": 4665783,
    "downVotes": 351853,
    "releaseYear": 2021,
    "ratingAverage": 4.4,
    "ratingCount": 5017636,
    "ratingHistogram": {
      "0.5": 70371,
      "1.0": 70371,
      "1.5": 52778,
      "2.0": 52778,
      "2.5": 52778,
      "3.0": 52778,
      "3.5": 233289,
      "4.0": 699867,
      "4.5": 1166446,
      "5.0": 2566181
    },
    "tags": [
      "horror",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Escape",
    "genre_l1": "Survival",
    "genre_l2": "Escape"
  },
  {
    "id": "game-dress-to-impress",
    "universeId": 5203828273,
    "rootPlaceId": 15101393044,
    "name": "[\u{1F382}] Dress To Impress",
    "description": "Create stunning outfits \u{1F457}\u{1F496}\u2B50, and strut the runway to show off your unique style. Collaborate, compete, and explore a world of glamour with friends!  \u2B50 Are you ready to be the TOP MODEL? \u{1F457} NEW ITEMS! Check them out. \u{1F37F} Vote for your favorite outfits! \u{1F483} Use poses on the runway to show off your out",
    "creatorName": "Dress To Impress Group",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-622d27cf094210e32f71577a301f1acd/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-622d27cf094210e32f71577a301f1acd/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 80311,
    "totalVisits": "11.0B+",
    "rawVisits": 10956570795,
    "favoritedCount": 7371623,
    "upVotes": 3971101,
    "downVotes": 413921,
    "releaseYear": 2023,
    "ratingAverage": 4.4,
    "ratingCount": 4385022,
    "ratingHistogram": {
      "0.5": 82784,
      "1.0": 82784,
      "1.5": 62088,
      "2.0": 62088,
      "2.5": 62088,
      "3.0": 62088,
      "3.5": 198555,
      "4.0": 595665,
      "4.5": 992775,
      "5.0": 2184106
    },
    "tags": [
      "social---fashion",
      "roblox",
      "multiplayer",
      "dti",
      "dress to impress",
      "fashion"
    ],
    "subgenre": "Dress Up",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Dress Up"
  },
  {
    "id": "game-blox-fruits",
    "universeId": 994732206,
    "rootPlaceId": 2753915549,
    "name": "[\u{1F9F2}] Blox Fruits",
    "description": "OUT NOW: \u{1F9F2} Magnet + \u{1F3DD}\uFE0F Sea 1 + MORE  Welcome to Blox Fruits! Become a master swordsman or a powerful blox fruit user as you train to become the strongest player to ever live. You can choose to fight against tough enemies or have powerful boss battles while sailing across the ocean to find hidden s",
    "creatorName": "Gamer Robot Inc",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter",
    "genre": "RPG",
    "playerCount": 385918,
    "totalVisits": "64.3B+",
    "rawVisits": 64308886814,
    "favoritedCount": 19883861,
    "upVotes": 12653597,
    "downVotes": 1058015,
    "releaseYear": 2019,
    "ratingAverage": 4.4,
    "ratingCount": 13711612,
    "ratingHistogram": {
      "0.5": 211603,
      "1.0": 211603,
      "1.5": 158702,
      "2.0": 158702,
      "2.5": 158702,
      "3.0": 158702,
      "3.5": 632680,
      "4.0": 1898040,
      "4.5": 3163399,
      "5.0": 6959478
    },
    "tags": [
      "anime---rpg",
      "roblox",
      "multiplayer",
      "bf",
      "blox fruits",
      "one piece",
      "devil fruit"
    ],
    "subgenre": "Action RPG",
    "genre_l1": "RPG",
    "genre_l2": "Action RPG"
  },
  {
    "id": "game-pressure",
    "universeId": 4367208330,
    "rootPlaceId": 12411473842,
    "name": "Pressure",
    "description": "You are expendable. You are not expected to return.  Headphones & graphics level 8 or above recommended. This game is currently in alpha. Expect bugs and the sorts.  Join the group to receive a 10% discount on any and all Dead-Drop Shop purchases.  \u26A0\uFE0F Exploiting using external programs and abusing b",
    "creatorName": "Urbanshade: Hadal Division",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-1c367e9e2c3d85b65c39323220b79d15/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-1c367e9e2c3d85b65c39323220b79d15/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 1543,
    "totalVisits": "487.3M+",
    "rawVisits": 487263853,
    "favoritedCount": 1639203,
    "upVotes": 726304,
    "downVotes": 111478,
    "releaseYear": 2023,
    "ratingAverage": 4.3,
    "ratingCount": 837782,
    "ratingHistogram": {
      "0.5": 22296,
      "1.0": 22296,
      "1.5": 16722,
      "2.0": 16722,
      "2.5": 16722,
      "3.0": 16722,
      "3.5": 36315,
      "4.0": 108946,
      "4.5": 181576,
      "5.0": 399467
    },
    "tags": [
      "horror",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Escape",
    "genre_l1": "Survival",
    "genre_l2": "Escape"
  },
  {
    "id": "game-deepwoken",
    "universeId": 1359573625,
    "rootPlaceId": 4111023553,
    "name": "Deepwoken",
    "description": ">> Deepwoken is a difficult game with permanent character loss. Losing characters is a part of the game that should be expected. <<  In Deepwoken, every story is yours to tell. Though, however short they may be is up to you. Arm yourself with a selection of hundreds of unique abilities. Plunder and ",
    "creatorName": "Monad Studios East",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-8af036394d38fd14eb20989f3e7e4924/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-8af036394d38fd14eb20989f3e7e4924/512/512/Image/Png/noFilter",
    "genre": "RPG",
    "playerCount": 4049,
    "totalVisits": "1.6B+",
    "rawVisits": 1632241171,
    "favoritedCount": 1037889,
    "upVotes": 412112,
    "downVotes": 65190,
    "releaseYear": 2019,
    "ratingAverage": 4.2,
    "ratingCount": 477302,
    "ratingHistogram": {
      "0.5": 13038,
      "1.0": 13038,
      "1.5": 9779,
      "2.0": 9779,
      "2.5": 9779,
      "3.0": 9779,
      "3.5": 20606,
      "4.0": 61817,
      "4.5": 103028,
      "5.0": 226662
    },
    "tags": [
      "hardcore-rpg",
      "roblox",
      "multiplayer",
      "dw",
      "deepwoken"
    ],
    "subgenre": "Action RPG",
    "genre_l1": "RPG",
    "genre_l2": "Action RPG"
  },
  {
    "id": "game-blade-ball",
    "universeId": 4777817887,
    "rootPlaceId": 13772394625,
    "name": "Blade Ball",
    "description": "\u26A1  In this game of focus, timing, and strategy, your skill is tested as a deflectable homing ball hunts players with increasing speed. But there's more than what meets the eye.  \u{1F525}  Gain new abilities and upgrade them to compliment your playstyle. Rise through the ranks by mastering your skill, and ",
    "creatorName": "Wiggity.",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-b7317d44fd85c141d154cede4aacf4b0/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-b7317d44fd85c141d154cede4aacf4b0/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 21413,
    "totalVisits": "6.4B+",
    "rawVisits": 6406983213,
    "favoritedCount": 12890774,
    "upVotes": 8414044,
    "downVotes": 584905,
    "releaseYear": 2023,
    "ratingAverage": 4.5,
    "ratingCount": 8998949,
    "ratingHistogram": {
      "0.5": 116981,
      "1.0": 116981,
      "1.5": 87736,
      "2.0": 87736,
      "2.5": 87736,
      "3.0": 87736,
      "3.5": 420702,
      "4.0": 1262107,
      "4.5": 2103511,
      "5.0": 4627724
    },
    "tags": [
      "action---arcade",
      "roblox",
      "multiplayer",
      "bb",
      "blade ball"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-rivals",
    "universeId": 6035872082,
    "rootPlaceId": 17625359962,
    "name": "[\u{1F63E}] RIVALS",
    "description": "Welcome to RIVALS, the most intense first person shooter game on Roblox! Challenge other players in 1v1 to 5v5 FPS duels where the first to 5 wins!  \u{1F63E} UPDATE 22 - A brand new weapon has arrived! Check out the patch notes in-game to see everything new! \u{1F389}   \u{1F52B} Challenge someone by stepping on a duel",
    "creatorName": "Nosniy Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-2f7bb0535e48ac3766835b44ded27a74/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-2f7bb0535e48ac3766835b44ded27a74/512/512/Image/Png/noFilter",
    "genre": "Shooter",
    "playerCount": 202724,
    "totalVisits": "18.0B+",
    "rawVisits": 18036375989,
    "favoritedCount": 91231517,
    "upVotes": 10535143,
    "downVotes": 701478,
    "releaseYear": 2024,
    "ratingAverage": 4.5,
    "ratingCount": 11236621,
    "ratingHistogram": {
      "0.5": 140296,
      "1.0": 140296,
      "1.5": 105222,
      "2.0": 105222,
      "2.5": 105222,
      "3.0": 105222,
      "3.5": 526757,
      "4.0": 1580271,
      "4.5": 2633786,
      "5.0": 5794329
    },
    "tags": [
      "fps---shooter",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Deathmatch Shooter",
    "genre_l1": "Shooter",
    "genre_l2": "Deathmatch Shooter"
  },
  {
    "id": "game-fisch",
    "universeId": 5750914919,
    "rootPlaceId": 16732694052,
    "name": "Fisch \u{1F349} [SKYCREST]",
    "description": "\u{1F988} Welcome to Fisch \u{1F988}  Dive into Fisch, the ultimate fishing adventure where exploration and progression are yours to control. Cast your line to catch rare and unique fish, each with 400,000+ possible variations. Explore a growing world with your trusty rod, and maybe even reel in some new friends ",
    "creatorName": "Fisching",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e4a60be5e47f439d81ba79b6b3e96963/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e4a60be5e47f439d81ba79b6b3e96963/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 86849,
    "totalVisits": "4.9B+",
    "rawVisits": 4881534307,
    "favoritedCount": 3614944,
    "upVotes": 2996324,
    "downVotes": 307622,
    "releaseYear": 2024,
    "ratingAverage": 4.4,
    "ratingCount": 3303946,
    "ratingHistogram": {
      "0.5": 61524,
      "1.0": 61524,
      "1.5": 46143,
      "2.0": 46143,
      "2.5": 46143,
      "3.0": 46143,
      "3.5": 149816,
      "4.0": 449449,
      "4.5": 749081,
      "5.0": 1647978
    },
    "tags": [
      "adventure---simulation",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Adventure",
    "genre_l1": "Simulation"
  },
  {
    "id": "game-tower-of-hell",
    "universeId": 703124385,
    "rootPlaceId": 1962086868,
    "name": "Tower of Hell",
    "description": "Can you be the first to the top in this randomly generated obby with absolutely no checkpoints at all?    Owners of VIP-Servers can use the settings menu to skip rounds, set the tower size and lock the shop.",
    "creatorName": "YXceptional Studios",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-9704151d9c8a70e7ebe0ced8cb2b95c1/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-9704151d9c8a70e7ebe0ced8cb2b95c1/512/512/Image/Png/noFilter",
    "genre": "Obby & Platformer",
    "playerCount": 61753,
    "totalVisits": "28.8B+",
    "rawVisits": 28804736617,
    "favoritedCount": 11961997,
    "upVotes": 4338124,
    "downVotes": 1557899,
    "releaseYear": 2018,
    "ratingAverage": 3.9,
    "ratingCount": 5896023,
    "ratingHistogram": {
      "0.5": 311580,
      "1.0": 311580,
      "1.5": 233685,
      "2.0": 233685,
      "2.5": 233685,
      "3.0": 233685,
      "3.5": 216906,
      "4.0": 650719,
      "4.5": 1084531,
      "5.0": 2385968
    },
    "tags": [
      "obby---platformer",
      "roblox",
      "multiplayer",
      "toh",
      "tower of hell"
    ],
    "subgenre": "Tower Obby",
    "genre_l1": "Obby & Platformer",
    "genre_l2": "Tower Obby"
  },
  {
    "id": "game-murder-mystery-2",
    "universeId": 66654135,
    "rootPlaceId": 142823291,
    "name": "Murder Mystery 2",
    "description": "Can you solve the Mystery and survive each round?  INNOCENTS: Run and hide from the Murderer. Use your detective skills to expose the Murderer. SHERIFF: Work with the Innocents; you are the only one with a weapon who can take down the Murderer.  MURDERER: Eliminate EVERYONE. Don't get shot by th",
    "creatorName": "Nikilis",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-3ac5af325970a745b0156a5358174169/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-3ac5af325970a745b0156a5358174169/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 330090,
    "totalVisits": "30.4B+",
    "rawVisits": 30358042684,
    "favoritedCount": 23998511,
    "upVotes": 10559708,
    "downVotes": 1065167,
    "releaseYear": 2014,
    "ratingAverage": 4.4,
    "ratingCount": 11624875,
    "ratingHistogram": {
      "0.5": 213033,
      "1.0": 213033,
      "1.5": 159775,
      "2.0": 159775,
      "2.5": 159775,
      "3.0": 159775,
      "3.5": 527985,
      "4.0": 1583956,
      "4.5": 2639927,
      "5.0": 5807839
    },
    "tags": [
      "survival---mystery",
      "roblox",
      "multiplayer",
      "mm2",
      "murder mystery",
      "knife"
    ],
    "subgenre": "1 vs All",
    "genre_l1": "Survival",
    "genre_l2": "1 vs All"
  },
  {
    "id": "game-item-asylum",
    "universeId": 1998835206,
    "rootPlaceId": 5670218884,
    "name": "[\u{1F382}] item asylum",
    "description": "!! WARNING: THIS GAME CONTAINS FLASHING LIGHTS AND LOUD NOISES !!  a meme and reference-filled randomizer fighting experience. can it get more chaotic?  how the experience works: every time you respawn, you get 3 random weapons: a melee (first slot) a ranged (second slot) and a miscellaneous (third ",
    "creatorName": "Jean's Bizarre Community",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-159ce52270cf160ad22f214943334420/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-159ce52270cf160ad22f214943334420/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 2620,
    "totalVisits": "590.0M+",
    "rawVisits": 589960119,
    "favoritedCount": 1174291,
    "upVotes": 512170,
    "downVotes": 77201,
    "releaseYear": 2020,
    "ratingAverage": 4.3,
    "ratingCount": 589371,
    "ratingHistogram": {
      "0.5": 15440,
      "1.0": 15440,
      "1.5": 11580,
      "2.0": 11580,
      "2.5": 11580,
      "3.0": 11580,
      "3.5": 25609,
      "4.0": 76826,
      "4.5": 128043,
      "5.0": 281694
    },
    "tags": [
      "arena---chaos",
      "roblox",
      "multiplayer",
      "ia",
      "item asylum"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-the-mimic",
    "universeId": 2294168059,
    "rootPlaceId": 6243699076,
    "name": "The Mimic",
    "description": "ABOUT:  Four stories created from Japanese history and urban legends with a twist. In each book, you will find yourself as different characters venturing into the unknown depths of worlds that mimics our reality.  WARNING: This game contains Flashing lights, Loud Noises & Jumpscares!   Join the grou",
    "creatorName": "CTStudio",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e7fcd16051fcc7e59d2a89cf89407ab9/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e7fcd16051fcc7e59d2a89cf89407ab9/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 4197,
    "totalVisits": "1.3B+",
    "rawVisits": 1251603829,
    "favoritedCount": 3376275,
    "upVotes": 1125996,
    "downVotes": 124868,
    "releaseYear": 2021,
    "ratingAverage": 4.4,
    "ratingCount": 1250864,
    "ratingHistogram": {
      "0.5": 24974,
      "1.0": 24974,
      "1.5": 18730,
      "2.0": 18730,
      "2.5": 18730,
      "3.0": 18730,
      "3.5": 56300,
      "4.0": 168899,
      "4.5": 281499,
      "5.0": 619298
    },
    "tags": [
      "horror",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Escape",
    "genre_l1": "Survival",
    "genre_l2": "Escape"
  },
  {
    "id": "game-brookhaven",
    "universeId": 1686885941,
    "rootPlaceId": 4924922222,
    "name": "Brookhaven \u{1F3E1}RP",
    "description": "A place to play with like minded people and roleplay. Own and live in amazing houses, drive cool vehicles and explore the city. Be whoever you want to be in Brookhaven RP.  Latest Update: \u{1F697} New Vehicles - Beater Car, Minivan, and Custom Street Racer! \u{1F430} New Pets - A bunny and turtle! \u{1F4C5} Next week..",
    "creatorName": "Brookhaven by Voldex",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-0dd115dcf30069741293a3987641b86d/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-0dd115dcf30069741293a3987641b86d/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 549200,
    "totalVisits": "87.5B+",
    "rawVisits": 87472605652,
    "favoritedCount": 29921069,
    "upVotes": 8532697,
    "downVotes": 1400884,
    "releaseYear": 2020,
    "ratingAverage": 4.2,
    "ratingCount": 9933581,
    "ratingHistogram": {
      "0.5": 280177,
      "1.0": 280177,
      "1.5": 210133,
      "2.0": 210133,
      "2.5": 210133,
      "3.0": 210133,
      "3.5": 426635,
      "4.0": 1279905,
      "4.5": 2133174,
      "5.0": 4692983
    },
    "tags": [
      "social---roleplay",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Life",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Life"
  },
  {
    "id": "game-adopt-me",
    "universeId": 383310974,
    "rootPlaceId": 920587237,
    "name": "[\u2B50] Adopt Me!",
    "description": "Adopt and raise \u{1F436}\u{1F984}\u{1F476}, trade and collect legendary pets, build your dream home, and roleplay with friends!  \u2B50 New daily Star Rewards! \u2B50 \u2B50 Buy your Rewards with daily Stars! \u{1F95A} Log-in 28 days for the Gemstone Egg! \u{1F48E} Hatch Legendary Amethyst Penguin!  Be FIRST \u{1F3C6} To experience new updates by pressin",
    "creatorName": "Uplift Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e2adbad115878800194c15eecab9a3a5/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e2adbad115878800194c15eecab9a3a5/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 161270,
    "totalVisits": "44.7B+",
    "rawVisits": 44693892195,
    "favoritedCount": 29578295,
    "upVotes": 9438384,
    "downVotes": 1511131,
    "releaseYear": 2017,
    "ratingAverage": 4.2,
    "ratingCount": 10949515,
    "ratingHistogram": {
      "0.5": 302226,
      "1.0": 302226,
      "1.5": 226670,
      "2.0": 226670,
      "2.5": 226670,
      "3.0": 226670,
      "3.5": 471919,
      "4.0": 1415758,
      "4.5": 2359596,
      "5.0": 5191111
    },
    "tags": [
      "social---pets",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Pet Care",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Pet Care"
  },
  {
    "id": "game-arsenal",
    "universeId": 111958650,
    "rootPlaceId": 286090429,
    "name": "Arsenal",
    "description": "Race to the top through a massive Arsenal of weapons!   Conquer the day in fast paced arcade gameplay, from bazookas to spell books, each weapon will keep you guessing on what's next!   Earn BattleBucks and trick out your game with a huge cast of characters, melees, kill effects, skins and more!  Jo",
    "creatorName": "ROLVe",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-29023c3f115f5eac513c836ef674fd42/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-29023c3f115f5eac513c836ef674fd42/512/512/Image/Png/noFilter",
    "genre": "Shooter",
    "playerCount": 3304,
    "totalVisits": "6.3B+",
    "rawVisits": 6297186761,
    "favoritedCount": 11515535,
    "upVotes": 5121482,
    "downVotes": 664504,
    "releaseYear": 2015,
    "ratingAverage": 4.3,
    "ratingCount": 5785986,
    "ratingHistogram": {
      "0.5": 132901,
      "1.0": 132901,
      "1.5": 99676,
      "2.0": 99676,
      "2.5": 99676,
      "3.0": 99676,
      "3.5": 256074,
      "4.0": 768222,
      "4.5": 1280371,
      "5.0": 2816815
    },
    "tags": [
      "fps---shooter",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Deathmatch Shooter",
    "genre_l1": "Shooter",
    "genre_l2": "Deathmatch Shooter"
  },
  {
    "id": "game-jailbreak",
    "universeId": 27634066,
    "rootPlaceId": 60680041,
    "name": "MegaMega23's Place",
    "description": "Jailbreak on Roblox by MegaMega23.",
    "creatorName": "MegaMega23",
    "creatorType": "User",
    "iconUrl": "https://t5.rbxcdn.com/180DAY-950708626319e299abab674f3b11816b",
    "bannerUrl": "https://t5.rbxcdn.com/180DAY-950708626319e299abab674f3b11816b",
    "genre": "Variety",
    "playerCount": 0,
    "totalVisits": "0",
    "rawVisits": 0,
    "favoritedCount": 0,
    "upVotes": 0,
    "downVotes": 0,
    "releaseYear": 2011,
    "ratingAverage": 4.5,
    "ratingCount": 0,
    "ratingHistogram": {
      "0.5": 0,
      "1.0": 0,
      "1.5": 0,
      "2.0": 0,
      "2.5": 0,
      "3.0": 0,
      "3.5": 0,
      "4.0": 0,
      "4.5": 0,
      "5.0": 0
    },
    "tags": [
      "action---open-world",
      "roblox",
      "multiplayer"
    ]
  },
  {
    "id": "game-pet-simulator-99",
    "universeId": 3317771874,
    "rootPlaceId": 8737899170,
    "name": "\u{1F579}\uFE0F [ARCADE] Pet Simulator 99! \u{1F4B0}",
    "description": "Create an army of the coolest pets! They will help you get RICH!  \u2728 Currently 3,000+ pets to collect! \u{1F43E}  \u{1F9E1} Thanks for playing!",
    "creatorName": "BIG Games Pets",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-c59b28a5559c17e6e36a138809af17b1/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-c59b28a5559c17e6e36a138809af17b1/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 72823,
    "totalVisits": "2.6B+",
    "rawVisits": 2633031531,
    "favoritedCount": 2192647,
    "upVotes": 3062949,
    "downVotes": 169966,
    "releaseYear": 2022,
    "ratingAverage": 4.5,
    "ratingCount": 3232915,
    "ratingHistogram": {
      "0.5": 33993,
      "1.0": 33993,
      "1.5": 25495,
      "2.0": 25495,
      "2.5": 25495,
      "3.0": 25495,
      "3.5": 153147,
      "4.0": 459442,
      "4.5": 765737,
      "5.0": 1684622
    },
    "tags": [
      "simulator---collecting",
      "roblox",
      "multiplayer",
      "simulator",
      "ps99",
      "pet sim 99",
      "psx",
      "pet simulator"
    ],
    "subgenre": "Incremental Simulator",
    "genre_l1": "Simulation",
    "genre_l2": "Incremental Simulator"
  },
  {
    "id": "game-bedwars",
    "universeId": 2619619496,
    "rootPlaceId": 6872265039,
    "name": "BedWars [\u2696\uFE0F BALANCE]",
    "description": "\u{1F525}\u{1F525} Updates are every FRIDAY at 3:00pm PDT, 6:00pm EDT \u{1F525}\u{1F525}  \u{1F3AE} Dive into over 10+ thrilling modes like Bed Wars, Lucky Block, SkyWars, Infected, and more! \u2728 Explore and craft your own games in Creative mode with optional scripting support! Let your imagination run wild!  \u{1F44B} HOW TO PLAY Bed Wars:  ",
    "creatorName": "Easy.gg",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-92dfbc55ac3653237f8a460aaf65f7e1/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-92dfbc55ac3653237f8a460aaf65f7e1/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 22217,
    "totalVisits": "11.7B+",
    "rawVisits": 11679308895,
    "favoritedCount": 4606336,
    "upVotes": 2467970,
    "downVotes": 531705,
    "releaseYear": 2021,
    "ratingAverage": 4.1,
    "ratingCount": 2999675,
    "ratingHistogram": {
      "0.5": 106341,
      "1.0": 106341,
      "1.5": 79756,
      "2.0": 79756,
      "2.5": 79756,
      "3.0": 79756,
      "3.5": 123399,
      "4.0": 370196,
      "4.5": 616993,
      "5.0": 1357384
    },
    "tags": [
      "action---strategy",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-tower-defense-simulator",
    "universeId": 1176784616,
    "rootPlaceId": 3260590327,
    "name": "[\u26A1\uFE0F NEW TOWER] Tower Defense Simulator",
    "description": "\u{1F49C} Thank you for 2 MILLION likes! Use code 2MILLION for a free Mercenary Pursuit skin!  Place units to defend against hordes of zombies! Team up with friends and face against even stronger bosses to unlock new units!  \u{1F465}\u{1F4B5} Join the Paradoxum Games group for +$100 starting cash!  \u{1F44D} Thumbs up and fav",
    "creatorName": "Paradoxum Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-c6d22e4b6e36fb4f64b8ce35dcdcf2ef/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-c6d22e4b6e36fb4f64b8ce35dcdcf2ef/512/512/Image/Png/noFilter",
    "genre": "Strategy",
    "playerCount": 18389,
    "totalVisits": "5.0B+",
    "rawVisits": 4964691601,
    "favoritedCount": 3495594,
    "upVotes": 2066961,
    "downVotes": 128328,
    "releaseYear": 2019,
    "ratingAverage": 4.5,
    "ratingCount": 2195289,
    "ratingHistogram": {
      "0.5": 25666,
      "1.0": 25666,
      "1.5": 19249,
      "2.0": 19249,
      "2.5": 19249,
      "3.0": 19249,
      "3.5": 103348,
      "4.0": 310044,
      "4.5": 516740,
      "5.0": 1136829
    },
    "tags": [
      "strategy---defense",
      "roblox",
      "multiplayer",
      "simulator",
      "tds",
      "tower defense simulator"
    ],
    "subgenre": "Tower Defense",
    "genre_l1": "Strategy",
    "genre_l2": "Tower Defense"
  },
  {
    "id": "game-da-hood",
    "universeId": 1008451066,
    "rootPlaceId": 2788229376,
    "name": "Da Hood",
    "description": "A difficult game, read below for tips.  Account has to be at least 10 days to play.   You can weave 100% if you time at the right time when blocking. To gain muscle buy weights at fitness.  Eat lettuce to reduce muscle.  Cop: To join cops go to the police station, if you execute anyone without cuffs",
    "creatorName": "Da Hood Entertainment",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-ae6cda2dcf44b42ebf33fd1f24578e42/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-ae6cda2dcf44b42ebf33fd1f24578e42/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 1900,
    "totalVisits": "2.9B+",
    "rawVisits": 2946350270,
    "favoritedCount": 3005540,
    "upVotes": 1295769,
    "downVotes": 541850,
    "releaseYear": 2019,
    "ratingAverage": 3.8,
    "ratingCount": 1837619,
    "ratingHistogram": {
      "0.5": 108370,
      "1.0": 108370,
      "1.5": 81278,
      "2.0": 81278,
      "2.5": 81278,
      "3.0": 81278,
      "3.5": 64788,
      "4.0": 194365,
      "4.5": 323942,
      "5.0": 712673
    },
    "tags": [
      "action---sandbox",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Open World Action",
    "genre_l1": "Action",
    "genre_l2": "Open World Action"
  },
  {
    "id": "game-bloxburg",
    "universeId": 88070565,
    "rootPlaceId": 185655149,
    "name": "[\u{1F37D}] Welcome to Bloxburg ",
    "description": "\u{1F44B} Welcome to the town of Bloxburg, where you can be anything you want to be!  \u{1F3E1} Build and decorate, or buy the house or creation of your dreams! \u{1F455} Customize your character with outfits and roles! \u{1F3AD} Roleplay with friends using interactive items and emotes!  \u{1F4BC} Choose a job and earn money + reward",
    "creatorName": "Bloxburg Development",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-975ef139ad526667e977addf45793a71/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-975ef139ad526667e977addf45793a71/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 14307,
    "totalVisits": "10.1B+",
    "rawVisits": 10091794506,
    "favoritedCount": 13984847,
    "upVotes": 5627897,
    "downVotes": 733724,
    "releaseYear": 2014,
    "ratingAverage": 4.3,
    "ratingCount": 6361621,
    "ratingHistogram": {
      "0.5": 146745,
      "1.0": 146745,
      "1.5": 110059,
      "2.0": 110059,
      "2.5": 110059,
      "3.0": 110059,
      "3.5": 281395,
      "4.0": 844185,
      "4.5": 1406974,
      "5.0": 3095343
    },
    "tags": [
      "simulation---roleplay",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Life",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Life"
  },
  {
    "id": "game-natural-disaster",
    "universeId": 65241,
    "rootPlaceId": 189707,
    "name": "Natural Disaster Survival",
    "description": "Quickly, run around in circles! Your life depends on it!",
    "creatorName": "Stickmasterluke",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-ac1c764a99cfae201fd4fe916170a218/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-ac1c764a99cfae201fd4fe916170a218/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 8926,
    "totalVisits": "4.4B+",
    "rawVisits": 4442663557,
    "favoritedCount": 11815643,
    "upVotes": 4388487,
    "downVotes": 445703,
    "releaseYear": 2008,
    "ratingAverage": 4.4,
    "ratingCount": 4834190,
    "ratingHistogram": {
      "0.5": 89141,
      "1.0": 89141,
      "1.5": 66855,
      "2.0": 66855,
      "2.5": 66855,
      "3.0": 66855,
      "3.5": 219424,
      "4.0": 658273,
      "4.5": 1097122,
      "5.0": 2413668
    },
    "tags": [
      "survival---classic",
      "roblox",
      "multiplayer"
    ],
    "genre_l1": "Survival"
  },
  {
    "id": "game-strongest-battlegrounds",
    "universeId": 3808081382,
    "rootPlaceId": 10449761463,
    "name": "The Strongest Battlegrounds",
    "description": "Train & fight others to be the strongest.  \u{1F4F1}\u{1F4BB}\u{1F3AE} You can play on any device. (CONSOLE, PC, MOBILE) \u2B50 Please consider liking and favoriting the game for more updates.  \u{1F5A5}\uFE0F Controls G - ultimate mode F - block Q - dash Q (while ragdolled) - ragdoll cancel/evasive Double Tap W - run Left Click - punch",
    "creatorName": "Yielding Arts",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-68c92fc62a8753793f7963e146b5197f/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-68c92fc62a8753793f7963e146b5197f/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 54227,
    "totalVisits": "19.2B+",
    "rawVisits": 19190019088,
    "favoritedCount": 7612755,
    "upVotes": 5282547,
    "downVotes": 1019676,
    "releaseYear": 2022,
    "ratingAverage": 4.2,
    "ratingCount": 6302223,
    "ratingHistogram": {
      "0.5": 203935,
      "1.0": 203935,
      "1.5": 152951,
      "2.0": 152951,
      "2.5": 152951,
      "3.0": 152951,
      "3.5": 264127,
      "4.0": 792382,
      "4.5": 1320637,
      "5.0": 2905401
    },
    "tags": [
      "action---anime",
      "roblox",
      "multiplayer",
      "pvp",
      "tsb",
      "strongest battlegrounds",
      "saitama"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-anime-vanguards",
    "universeId": 5578556129,
    "rootPlaceId": 16146832113,
    "name": "Anime Vanguards: Holy Retribution",
    "description": "Welcome To Anime Vanguards! \u2728 All the worlds and universes need your help! An event has caused multiple worlds to collide. Summon units to fight these enemies and save these worlds and embark on a thrilling journey to become the strongest! \u2728 \u{1F680} Summon units to fend off enemies! \u{1F929} Level Up and Evolve!",
    "creatorName": "Kitawari",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-31148a6446e3261000387cf3c62d4dff/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-31148a6446e3261000387cf3c62d4dff/512/512/Image/Png/noFilter",
    "genre": "Strategy",
    "playerCount": 21481,
    "totalVisits": "2.0B+",
    "rawVisits": 2038205619,
    "favoritedCount": 1988628,
    "upVotes": 2584711,
    "downVotes": 87229,
    "releaseYear": 2024,
    "ratingAverage": 4.6,
    "ratingCount": 2671940,
    "ratingHistogram": {
      "0.5": 17446,
      "1.0": 17446,
      "1.5": 13084,
      "2.0": 13084,
      "2.5": 13084,
      "3.0": 13084,
      "3.5": 129236,
      "4.0": 387707,
      "4.5": 646178,
      "5.0": 1421591
    },
    "tags": [
      "tower-defense",
      "strategy",
      "anime",
      "roblox",
      "multiplayer",
      "av",
      "anime vanguards"
    ],
    "subgenre": "Tower Defense",
    "genre_l1": "Strategy",
    "genre_l2": "Tower Defense"
  },
  {
    "id": "game-dandys-world",
    "universeId": 4872175953,
    "rootPlaceId": 14282329144,
    "name": "Dandy's World [ALPHA]",
    "description": "Descend into Gardenview and uncover the dark secrets behind the beloved mascot cartoon. Work together with your fellow Toons to extract Ichor, avoid the Twisteds, and survive floor after floor in this rogue-lite mascot horror experience.",
    "creatorName": "BlushCrunch Studio",
    "creatorType": "Group",
    "iconUrl": "https://t6.rbxcdn.com/180DAY-007dc222a830b5992e1a04073454e980",
    "bannerUrl": "https://t6.rbxcdn.com/180DAY-007dc222a830b5992e1a04073454e980",
    "genre": "Variety",
    "playerCount": 42100,
    "totalVisits": "480M+",
    "rawVisits": 48012e4,
    "favoritedCount": 142e4,
    "upVotes": 854e3,
    "downVotes": 42e3,
    "releaseYear": 2024,
    "ratingAverage": 4.7,
    "ratingCount": 896e3,
    "ratingHistogram": {
      "0.5": 12e3,
      "1.0": 1e4,
      "1.5": 8e3,
      "2.0": 9e3,
      "2.5": 11e3,
      "3.0": 15e3,
      "3.5": 35e3,
      "4.0": 11e4,
      "4.5": 23e4,
      "5.0": 456e3
    },
    "tags": [
      "horror---survival",
      "horror",
      "mascot horror",
      "roblox",
      "multiplayer",
      "dw",
      "dandys world"
    ]
  },
  {
    "id": "game-3008",
    "universeId": 1047124238,
    "rootPlaceId": 2768379856,
    "name": "3008 [LoneWatermelon]",
    "description": "Trapped inside an endless, infinite furniture store. Scavenge for food, build fortresses out of pallets and couches with friends, and survive the night when the Employees become hostile.",
    "creatorName": "uglyburger0",
    "creatorType": "User",
    "iconUrl": "https://t3.rbxcdn.com/180DAY-8a2116bd9d541c179d7bd4e611fe58b8",
    "bannerUrl": "https://t3.rbxcdn.com/180DAY-8a2116bd9d541c179d7bd4e611fe58b8",
    "genre": "Variety",
    "playerCount": 28400,
    "totalVisits": "2.4B+",
    "rawVisits": 24e8,
    "favoritedCount": 42e5,
    "upVotes": 21e5,
    "downVotes": 14e4,
    "releaseYear": 2019,
    "ratingAverage": 4.5,
    "ratingCount": 224e4,
    "ratingHistogram": {
      "0.5": 3e4,
      "1.0": 25e3,
      "1.5": 2e4,
      "2.0": 22e3,
      "2.5": 28e3,
      "3.0": 45e3,
      "3.5": 11e4,
      "4.0": 34e4,
      "4.5": 62e4,
      "5.0": 102e4
    },
    "tags": [
      "horror---survival",
      "horror",
      "survival",
      "scp",
      "3008",
      "infinite ikea",
      "roblox",
      "multiplayer"
    ]
  },
  {
    "id": "game-apeirophobia",
    "universeId": 3418193237,
    "rootPlaceId": 9024097486,
    "name": "Apeirophobia [Backrooms Horror]",
    "description": "Centered around the theme of exploration and escaping. Stranded in endless rooms with eerie sounds and lurking entities. Stay together, solve intricate puzzles, and navigate through the liminal horror.",
    "creatorName": "Polaroid Studios",
    "creatorType": "Group",
    "iconUrl": "https://t4.rbxcdn.com/180DAY-d111e601a049bc036dbee4dd47894778",
    "bannerUrl": "https://t4.rbxcdn.com/180DAY-d111e601a049bc036dbee4dd47894778",
    "genre": "Variety",
    "playerCount": 12500,
    "totalVisits": "410M+",
    "rawVisits": 41e7,
    "favoritedCount": 115e4,
    "upVotes": 68e4,
    "downVotes": 35e3,
    "releaseYear": 2022,
    "ratingAverage": 4.6,
    "ratingCount": 715e3,
    "ratingHistogram": {
      "0.5": 9e3,
      "1.0": 8e3,
      "1.5": 7e3,
      "2.0": 8e3,
      "2.5": 9e3,
      "3.0": 12e3,
      "3.5": 32e3,
      "4.0": 98e3,
      "4.5": 19e4,
      "5.0": 342e3
    },
    "tags": [
      "horror---puzzle",
      "horror",
      "backrooms",
      "apeirophobia",
      "puzzle",
      "roblox",
      "multiplayer"
    ]
  },
  {
    "id": "game-evade",
    "universeId": 3647333358,
    "rootPlaceId": 9872472334,
    "name": "Evade ",
    "description": "\u{1F527} We've rewritten the codebase for better stability and optimization  Action parkour game, where movement is the key to success in surviving the Nextbots.  \u26A0\uFE0FUsing exploits, fastflags, or any other forms of cheats will result in an unappealable ban \u26A0\uFE0F  \u26A0\uFE0FYou may experience flashing lights and loud ",
    "creatorName": "Hexagon Development Community",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-bf95a86e5f5e37bf61a5f33401e95deb/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-bf95a86e5f5e37bf61a5f33401e95deb/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 37398,
    "totalVisits": "9.2B+",
    "rawVisits": 9163276119,
    "favoritedCount": 8220849,
    "upVotes": 3210112,
    "downVotes": 208432,
    "releaseYear": 2022,
    "ratingAverage": 4.5,
    "ratingCount": 3418544,
    "ratingHistogram": {
      "0.5": 41686,
      "1.0": 41686,
      "1.5": 31265,
      "2.0": 31265,
      "2.5": 31265,
      "3.0": 31265,
      "3.5": 160506,
      "4.0": 481517,
      "4.5": 802528,
      "5.0": 1765562
    },
    "tags": [
      "horror---survival",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Horror",
    "genre_l1": "Survival"
  },
  {
    "id": "game-slap-battles",
    "universeId": 2380077519,
    "rootPlaceId": 6403373529,
    "name": "[UPDATE\u{1F41A}] Slap Battles\u{1F44F}",
    "description": "A game about slapping people into oblivion using different gloves with unique abilities. This game is very chaotic, so don't be surprised if you spot someone complaining about some glove that I'm pretty sure originated from hell itself. You earn slaps when slapping people, which are used to unlock n",
    "creatorName": "Slap Battles",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-8637ca6df36c828ef3df9f06a26e94a6/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-8637ca6df36c828ef3df9f06a26e94a6/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 11668,
    "totalVisits": "3.6B+",
    "rawVisits": 3629584050,
    "favoritedCount": 4629175,
    "upVotes": 1951523,
    "downVotes": 316284,
    "releaseYear": 2021,
    "ratingAverage": 4.2,
    "ratingCount": 2267807,
    "ratingHistogram": {
      "0.5": 63257,
      "1.0": 63257,
      "1.5": 47443,
      "2.0": 47443,
      "2.5": 47443,
      "3.0": 47443,
      "3.5": 97576,
      "4.0": 292728,
      "4.5": 487881,
      "5.0": 1073338
    },
    "tags": [
      "action---arena",
      "roblox",
      "multiplayer",
      "pvp"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-royale-high",
    "universeId": 321778215,
    "rootPlaceId": 735030788,
    "name": "Royale\u{1F33A}High",
    "description": "\u2661 \u2601\uFE0F Welcome to your magical dream world! \u2601\uFE0F \u2661  \u{1F4E3}July 16th Update!\u{1F4E3} \u{1F33A} NEW items have shorelined in Queen Harmony's Treasure Shop! \u{1F9DC}\u200D\u2640\uFE0F \u{1FAAE} 3 NEW Hairstyles - our first EVER to be animated with PHYSICS! With 8 new bangs by ReddieTheTeddy!!! \u{1F3B5} NEW Dorm Item: Dream Fountain Music Box! Wish from the",
    "creatorName": "callmehbob",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-70261ea10395ff2b3e27f1d562ade61c/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-70261ea10395ff2b3e27f1d562ade61c/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 6088,
    "totalVisits": "10.4B+",
    "rawVisits": 10446257659,
    "favoritedCount": 13317135,
    "upVotes": 3258503,
    "downVotes": 534895,
    "releaseYear": 2017,
    "ratingAverage": 4.2,
    "ratingCount": 3793398,
    "ratingHistogram": {
      "0.5": 106979,
      "1.0": 106979,
      "1.5": 80234,
      "2.0": 80234,
      "2.5": 80234,
      "3.0": 80234,
      "3.5": 162925,
      "4.0": 488775,
      "4.5": 814626,
      "5.0": 1792177
    },
    "tags": [
      "social---fantasy",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Dress Up",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Dress Up"
  },
  {
    "id": "game-build-a-boat",
    "universeId": 210851291,
    "rootPlaceId": 537413528,
    "name": "Build A Boat For Treasure",
    "description": "Build your ship and set sail for your adventure!  Liked the game? Don't forget to leave a Thumbs Up(\u{1F44D}) and Favorite(\u{1F31F}) . Thank you!  Don't forget to check out our group! https://www.roblox.com/My/Groups.aspx?gid=2782840  Group Perks: \u2728Member\u2728 --- 25% more gold! \u{1F4AB}Mega Member\u{1F4AB} --- 300% ",
    "creatorName": "Chillz Studios",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-a16e27d3d8380da38b43960549590ca2/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-a16e27d3d8380da38b43960549590ca2/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 19363,
    "totalVisits": "5.2B+",
    "rawVisits": 5182449401,
    "favoritedCount": 8500794,
    "upVotes": 3643034,
    "downVotes": 258308,
    "releaseYear": 2016,
    "ratingAverage": 4.5,
    "ratingCount": 3901342,
    "ratingHistogram": {
      "0.5": 51662,
      "1.0": 51662,
      "1.5": 38746,
      "2.0": 38746,
      "2.5": 38746,
      "3.0": 38746,
      "3.5": 182152,
      "4.0": 546455,
      "4.5": 910759,
      "5.0": 2003669
    },
    "tags": [
      "adventure---building",
      "roblox",
      "multiplayer",
      "babft",
      "build a boat"
    ],
    "subgenre": "Sandbox",
    "genre_l1": "Simulation",
    "genre_l2": "Sandbox"
  },
  {
    "id": "game-bee-swarm",
    "universeId": 601130232,
    "rootPlaceId": 1537690962,
    "name": "Bee Swarm Simulator",
    "description": "Grow your own swarm of bees, collect pollen, and make honey in Bee Swarm Simulator! Meet friendly bears, complete their quests and get rewards! As your hive grows larger and larger, you can explore further up the mountain. Use your bees to defeat dangerous bugs and monsters. Look for treasures hidde",
    "creatorName": "Onett",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-47a5cb3cce196ed1f9ddbc097c415ad1/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-47a5cb3cce196ed1f9ddbc097c415ad1/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 22228,
    "totalVisits": "4.6B+",
    "rawVisits": 4557623684,
    "favoritedCount": 6526194,
    "upVotes": 3021373,
    "downVotes": 139641,
    "releaseYear": 2018,
    "ratingAverage": 4.5,
    "ratingCount": 3161014,
    "ratingHistogram": {
      "0.5": 27928,
      "1.0": 27928,
      "1.5": 20946,
      "2.0": 20946,
      "2.5": 20946,
      "3.0": 20946,
      "3.5": 151069,
      "4.0": 453206,
      "4.5": 755343,
      "5.0": 1661755
    },
    "tags": [
      "simulator---adventure",
      "roblox",
      "multiplayer",
      "simulator"
    ],
    "subgenre": "Incremental Simulator",
    "genre_l1": "Simulation",
    "genre_l2": "Incremental Simulator"
  },
  {
    "id": "game-work-at-pizza",
    "universeId": 47545,
    "rootPlaceId": 192800,
    "name": "\u{1F355}Work at a Pizza Place",
    "description": "\u{1F91D}Work as a team to fulfill food orders. \u{1F3E0}Use your work earnings to upgrade your house and buy furniture.  Don't forget to \u{1F44D} and \u2B50! It really helps!",
    "creatorName": "Dued1",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-ae06e2703a3f516a9946173e656912c0/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-ae06e2703a3f516a9946173e656912c0/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 5564,
    "totalVisits": "5.6B+",
    "rawVisits": 5571120627,
    "favoritedCount": 13535151,
    "upVotes": 3448018,
    "downVotes": 263381,
    "releaseYear": 2008,
    "ratingAverage": 4.4,
    "ratingCount": 3711399,
    "ratingHistogram": {
      "0.5": 52676,
      "1.0": 52676,
      "1.5": 39507,
      "2.0": 39507,
      "2.5": 39507,
      "3.0": 39507,
      "3.5": 172401,
      "4.0": 517203,
      "4.5": 862005,
      "5.0": 1896410
    },
    "tags": [
      "simulation---classic",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Life",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Life"
  },
  {
    "id": "game-theme-park-2",
    "universeId": 31970568,
    "rootPlaceId": 69184822,
    "name": "Theme Park Tycoon 2",
    "description": "In Theme Park Tycoon 2 you get your own plot of land to build your own theme park on, together with your friends! Construct a range of rides the way you want and design your own roller coasters to truly make your park your own! Select from hundreds of scenery pieces to decorate your park further!",
    "creatorName": "Den_S",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-cdddc8bcd502f7c749cd5ea7692ba940/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-cdddc8bcd502f7c749cd5ea7692ba940/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 5550,
    "totalVisits": "1.6B+",
    "rawVisits": 1614850643,
    "favoritedCount": 6089418,
    "upVotes": 2079395,
    "downVotes": 256651,
    "releaseYear": 2012,
    "ratingAverage": 4.3,
    "ratingCount": 2336046,
    "ratingHistogram": {
      "0.5": 51330,
      "1.0": 51330,
      "1.5": 38498,
      "2.0": 38498,
      "2.5": 38498,
      "3.0": 38498,
      "3.5": 103970,
      "4.0": 311909,
      "4.5": 519849,
      "5.0": 1143667
    },
    "tags": [
      "tycoon---building",
      "roblox",
      "multiplayer",
      "tycoon"
    ],
    "subgenre": "Tycoon",
    "genre_l1": "Simulation",
    "genre_l2": "Tycoon"
  },
  {
    "id": "game-piggy",
    "universeId": 1516533665,
    "rootPlaceId": 4623386862,
    "name": "Piggy",
    "description": "Do you have what it takes to escape Piggy and uncover the mysteries surrounding the beast?  Controls: Pick up items / Use items - Click (Computer), Tap (Mobile) or Right Trigger (Controller) Crouch / Place trap - CTRL (Computer), Tap (Mobile) or B (Controller)  Credits: IK3As - Building Optikk & Epi",
    "creatorName": "Piggy Dev Team",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-88c605cc111c862403ae2d1e0f4bce6b/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-88c605cc111c862403ae2d1e0f4bce6b/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 5990,
    "totalVisits": "14.3B+",
    "rawVisits": 14326776901,
    "favoritedCount": 12209905,
    "upVotes": 4040643,
    "downVotes": 433778,
    "releaseYear": 2020,
    "ratingAverage": 4.4,
    "ratingCount": 4474421,
    "ratingHistogram": {
      "0.5": 86756,
      "1.0": 86756,
      "1.5": 65067,
      "2.0": 65067,
      "2.5": 65067,
      "3.0": 65067,
      "3.5": 202032,
      "4.0": 606096,
      "4.5": 1010161,
      "5.0": 2222354
    },
    "tags": [
      "horror---puzzle",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Horror",
    "genre_l1": "Survival"
  },
  {
    "id": "game-grand-piece-online",
    "universeId": 648454481,
    "rootPlaceId": 1730877806,
    "name": "[\u{1F406}LEOPARD\u{1F406}] Grand Piece Online",
    "description": "Set out on a journey on the vast sea in seek of wealth, fame, and power! Gain experience through quests, discover various fighting styles, and find ability-granting fruits to become stronger! Compete with other players through arena modes and battle royale!\u{1F3F4}\u200D\u2620\uFE0F\u2728  Current max level: 675  Current fru",
    "creatorName": "Grand Quest Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-ac5cae9ca606a1a3d2e9a81b3ad29247/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-ac5cae9ca606a1a3d2e9a81b3ad29247/512/512/Image/Png/noFilter",
    "genre": "RPG",
    "playerCount": 21492,
    "totalVisits": "1.3B+",
    "rawVisits": 1298836355,
    "favoritedCount": 1502341,
    "upVotes": 1067294,
    "downVotes": 120959,
    "releaseYear": 2018,
    "ratingAverage": 4.3,
    "ratingCount": 1188253,
    "ratingHistogram": {
      "0.5": 24192,
      "1.0": 24192,
      "1.5": 18144,
      "2.0": 18144,
      "2.5": 18144,
      "3.0": 18144,
      "3.5": 53365,
      "4.0": 160094,
      "4.5": 266824,
      "5.0": 587012
    },
    "tags": [
      "anime---adventure",
      "roblox",
      "multiplayer",
      "gpo",
      "grand piece online"
    ],
    "subgenre": "Action RPG",
    "genre_l1": "RPG",
    "genre_l2": "Action RPG"
  },
  {
    "id": "game-king-legacy",
    "universeId": 1451439645,
    "rootPlaceId": 4520749081,
    "name": "King Legacy",
    "description": "Join the community server for more information and codes!  Level Cap: 5450 There are 44 Physical Fruits In-Game  - Fruits spawn on the map every 1 - 2 Hours / Despawn 15 Minutes. - First Time you join the game you have a 0.1% chance to get a free Conqueror Ability  Current fruits in the game:  Allo,",
    "creatorName": "Sea King Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-8d0a42cbf6f6c05180a90b8f99a5eb72/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-8d0a42cbf6f6c05180a90b8f99a5eb72/512/512/Image/Png/noFilter",
    "genre": "RPG",
    "playerCount": 6444,
    "totalVisits": "4.1B+",
    "rawVisits": 4051974293,
    "favoritedCount": 2765325,
    "upVotes": 1691057,
    "downVotes": 157761,
    "releaseYear": 2019,
    "ratingAverage": 4.4,
    "ratingCount": 1848818,
    "ratingHistogram": {
      "0.5": 31552,
      "1.0": 31552,
      "1.5": 23664,
      "2.0": 23664,
      "2.5": 23664,
      "3.0": 23664,
      "3.5": 84553,
      "4.0": 253659,
      "4.5": 422764,
      "5.0": 930081
    },
    "tags": [
      "anime---rpg",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Action RPG",
    "genre_l1": "RPG",
    "genre_l2": "Action RPG"
  },
  {
    "id": "game-type-soul",
    "universeId": 4871329703,
    "rootPlaceId": 14067600077,
    "name": "TYPE://SOUL",
    "description": "Controls: Left Alt - Shift-lock Ctrl + K - Monster transformations/Mask rip J - Reaper weapon Ctrl + J - Reaper transformation/Monster transformation Q - Dash Z X C - Element / Vollstandig Moveset T G - Schrift / Element Release Moveset R - Critical N - Inventory/Skill tree M - Meditate P - Emote B ",
    "creatorName": "Type Soul",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-95cec754219956ebd33e5bdf165145df/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-95cec754219956ebd33e5bdf165145df/512/512/Image/Png/noFilter",
    "genre": "RPG",
    "playerCount": 345,
    "totalVisits": "817.8M+",
    "rawVisits": 817752553,
    "favoritedCount": 555076,
    "upVotes": 397915,
    "downVotes": 98210,
    "releaseYear": 2023,
    "ratingAverage": 4.1,
    "ratingCount": 496125,
    "ratingHistogram": {
      "0.5": 19642,
      "1.0": 19642,
      "1.5": 14732,
      "2.0": 14732,
      "2.5": 14732,
      "3.0": 14732,
      "3.5": 19896,
      "4.0": 59687,
      "4.5": 99479,
      "5.0": 218853
    },
    "tags": [
      "anime---action",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Action RPG",
    "genre_l1": "RPG",
    "genre_l2": "Action RPG"
  },
  {
    "id": "game-anime-defenders",
    "universeId": 5836869368,
    "rootPlaceId": 17017769292,
    "name": "Anime Defenders",
    "description": "Welcome to Anime Defenders - a highly anticipated Anime Tower Defense game!  \u{1F525} Enter the world of Anime Defenders and summon your favorite heroes! \u2694\uFE0F Deploy powerful units and activate their unique abilities to defend against relentless enemy waves! \u{1F3C6} Master challenging levels or prove your skills",
    "creatorName": "Small World Games x Anime Defenders",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-2ef69e4e4d0be01a2b12ecb16536d54f/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-2ef69e4e4d0be01a2b12ecb16536d54f/512/512/Image/Png/noFilter",
    "genre": "Strategy",
    "playerCount": 184,
    "totalVisits": "3.4B+",
    "rawVisits": 3433488803,
    "favoritedCount": 919151,
    "upVotes": 2025639,
    "downVotes": 68889,
    "releaseYear": 2024,
    "ratingAverage": 4.6,
    "ratingCount": 2094528,
    "ratingHistogram": {
      "0.5": 13778,
      "1.0": 13778,
      "1.5": 10333,
      "2.0": 10333,
      "2.5": 10333,
      "3.0": 10333,
      "3.5": 101282,
      "4.0": 303846,
      "4.5": 506410,
      "5.0": 1114101
    },
    "tags": [
      "tower-defense",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Tower Defense",
    "genre_l1": "Strategy",
    "genre_l2": "Tower Defense"
  },
  {
    "id": "game-driving-empire",
    "universeId": 1202096104,
    "rootPlaceId": 3351674303,
    "name": "Driving Empire [DODGE UPDATE\u2728] ",
    "description": "Welcome to Driving Empire, the #1 driving experience on Roblox!   \u2757Latest Update | SEPTEMBER 04, 2026 \u2757 \u{1F699} 9  NEW DODGE VEHICLES \u{1F699} \u{1F306} New Car Meet Location   \u{1F3C1} Realistic open-world driving, racing simulation & RP experience \u{1F3CE}\uFE0F 300+ cars and boats to choose \u{1FAAA} Licensed brands like Lamborghini, McL",
    "creatorName": "Driving Empire by Voldex",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-53bcc30e65b73ea367490997918740ee/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-53bcc30e65b73ea367490997918740ee/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 38675,
    "totalVisits": "3.3B+",
    "rawVisits": 3269497734,
    "favoritedCount": 31732820,
    "upVotes": 2517371,
    "downVotes": 188045,
    "releaseYear": 2019,
    "ratingAverage": 4.4,
    "ratingCount": 2705416,
    "ratingHistogram": {
      "0.5": 37609,
      "1.0": 37609,
      "1.5": 28207,
      "2.0": 28207,
      "2.5": 28207,
      "3.0": 28207,
      "3.5": 125869,
      "4.0": 377606,
      "4.5": 629343,
      "5.0": 1384554
    },
    "tags": [
      "racing---driving",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Vehicle Sim",
    "genre_l1": "Simulation",
    "genre_l2": "Vehicle Sim"
  },
  {
    "id": "game-speed-run-4",
    "universeId": 83858907,
    "rootPlaceId": 183364845,
    "name": "Speed Run 4",
    "description": "Join in the fast paced fun and test your skill with this challenging platformer! There are dozens of unique levels to run and parkour through to victory. Each level has a unique song and appearance.. Can you reach all the final levels? Race your friends, or race against the clock and keep an eye on ",
    "creatorName": "Vurse",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-ffcf22e41a17051fdc1628c6c545c0b7/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-ffcf22e41a17051fdc1628c6c545c0b7/512/512/Image/Png/noFilter",
    "genre": "Obby & Platformer",
    "playerCount": 1163,
    "totalVisits": "1.7B+",
    "rawVisits": 1746553544,
    "favoritedCount": 4555258,
    "upVotes": 1037082,
    "downVotes": 368657,
    "releaseYear": 2014,
    "ratingAverage": 3.9,
    "ratingCount": 1405739,
    "ratingHistogram": {
      "0.5": 73731,
      "1.0": 73731,
      "1.5": 55299,
      "2.0": 55299,
      "2.5": 55299,
      "3.0": 55299,
      "3.5": 51854,
      "4.0": 155562,
      "4.5": 259271,
      "5.0": 570395
    },
    "tags": [
      "obby---speedrun",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Adventure",
    "genre_l1": "Obby & Platformer"
  },
  {
    "id": "game-phantom-forces",
    "universeId": 113491250,
    "rootPlaceId": 292439477,
    "name": "Phantom Forces",
    "description": "Phantom Forces is an FPS featuring thousands of possible weapon loadouts you can create! Fully customize your weapons with hundreds of attachments and skins for playing! Compete with your friends in different game modes across many maps from urban environments to desert towns to frozen wastelands!  ",
    "creatorName": "StyLiS Studios",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-717f6839a37d00ddc8bcc9863e7ae6da/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-717f6839a37d00ddc8bcc9863e7ae6da/512/512/Image/Png/noFilter",
    "genre": "Shooter",
    "playerCount": 2354,
    "totalVisits": "1.8B+",
    "rawVisits": 1796380565,
    "favoritedCount": 5982973,
    "upVotes": 2462205,
    "downVotes": 250823,
    "releaseYear": 2015,
    "ratingAverage": 4.4,
    "ratingCount": 2713028,
    "ratingHistogram": {
      "0.5": 50165,
      "1.0": 50165,
      "1.5": 37623,
      "2.0": 37623,
      "2.5": 37623,
      "3.0": 37623,
      "3.5": 123110,
      "4.0": 369331,
      "4.5": 615551,
      "5.0": 1354213
    },
    "tags": [
      "fps---tactical",
      "roblox",
      "multiplayer",
      "pf",
      "phantom forces"
    ],
    "subgenre": "Deathmatch Shooter",
    "genre_l1": "Shooter",
    "genre_l2": "Deathmatch Shooter"
  },
  {
    "id": "game-combat-warriors",
    "universeId": 1390601379,
    "rootPlaceId": 4282985734,
    "name": "Combat Warriors",
    "description": 'A bloody and gory melee & ranged weapon fighting game.  Premium users have access to Premium AFK Rewards by clicking the button with the Premium icon found on the bottom left of the main menu  2x XP + chance for Daily Spins from kills every Friday, Saturday, and Sunday  Type "/psCmds" in chat to vie',
    "creatorName": "PlayCombatWarriors",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-aceb5959312903e9ffd26462c3584fcc/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-aceb5959312903e9ffd26462c3584fcc/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 1998,
    "totalVisits": "1.4B+",
    "rawVisits": 1448631725,
    "favoritedCount": 2368127,
    "upVotes": 1364958,
    "downVotes": 270162,
    "releaseYear": 2019,
    "ratingAverage": 4.2,
    "ratingCount": 1635120,
    "ratingHistogram": {
      "0.5": 54032,
      "1.0": 54032,
      "1.5": 40524,
      "2.0": 40524,
      "2.5": 40524,
      "3.0": 40524,
      "3.5": 68248,
      "4.0": 204744,
      "4.5": 341240,
      "5.0": 750727
    },
    "tags": [
      "fighting---action",
      "roblox",
      "multiplayer",
      "cw",
      "combat warriors"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-flee-the-facility",
    "universeId": 372226183,
    "rootPlaceId": 893973440,
    "name": "\u{1F382}Flee the Facility\u{1F3AA}",
    "description": "RUN, HIDE, ESCAPE! Run from the beast, unlock the exits, and flee the facility! This game runs well on phones, tablets, PC, Xbox, and PlayStation.  \u{1F4CB}GAME RULES\u{1F4CB} https://devforum.roblox.com/t/flee-the-facility-game-rules/3941301  \u2B50CREDITS\u2B50 https://devforum.roblox.com/t/flee-the-facility-credits/202",
    "creatorName": "A.W. Apps",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e68a512ad1c725b492c66b366748f55c/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e68a512ad1c725b492c66b366748f55c/512/512/Image/Png/noFilter",
    "genre": "Survival",
    "playerCount": 29647,
    "totalVisits": "6.0B+",
    "rawVisits": 5995046277,
    "favoritedCount": 9687301,
    "upVotes": 2785272,
    "downVotes": 239010,
    "releaseYear": 2017,
    "ratingAverage": 4.4,
    "ratingCount": 3024282,
    "ratingHistogram": {
      "0.5": 47802,
      "1.0": 47802,
      "1.5": 35852,
      "2.0": 35852,
      "2.5": 35852,
      "3.0": 35852,
      "3.5": 139264,
      "4.0": 417791,
      "4.5": 696318,
      "5.0": 1531900
    },
    "tags": [
      "horror---survival",
      "roblox",
      "multiplayer",
      "ftf",
      "flee the facility",
      "beast"
    ],
    "subgenre": "1 vs All",
    "genre_l1": "Survival",
    "genre_l2": "1 vs All"
  },
  {
    "id": "game-lumber-tycoon-2",
    "universeId": 2471084,
    "rootPlaceId": 13822889,
    "name": "\u{1F333} Lumber Tycoon 2",
    "description": "Welcome to Lumberland!  Deforest your surroundings and build your dreams! Check the changelog to keep up with the most recent updates. You can find it in the game menu.  Thanks for playing!",
    "creatorName": "Defaultio",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-ce843fd3f00692899556df857a836fd7/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-ce843fd3f00692899556df857a836fd7/512/512/Image/Png/noFilter",
    "genre": "Simulation",
    "playerCount": 1959,
    "totalVisits": "1.3B+",
    "rawVisits": 1312309161,
    "favoritedCount": 4618632,
    "upVotes": 2024548,
    "downVotes": 284175,
    "releaseYear": 2009,
    "ratingAverage": 4.3,
    "ratingCount": 2308723,
    "ratingHistogram": {
      "0.5": 56835,
      "1.0": 56835,
      "1.5": 42626,
      "2.0": 42626,
      "2.5": 42626,
      "3.0": 42626,
      "3.5": 101227,
      "4.0": 303682,
      "4.5": 506137,
      "5.0": 1113501
    },
    "tags": [
      "tycoon---classic",
      "roblox",
      "multiplayer",
      "tycoon"
    ],
    "subgenre": "Tycoon",
    "genre_l1": "Simulation",
    "genre_l2": "Tycoon"
  },
  {
    "id": "game-restaurant-tycoon-2",
    "universeId": 1148990834,
    "rootPlaceId": 3182142378,
    "name": "lilianOwOkm's Place",
    "description": "This is your very first Roblox creation. Check it out, then make it your own with Roblox Studio!",
    "creatorName": "lilianOwOkm",
    "creatorType": "User",
    "iconUrl": "https://t3.rbxcdn.com/180DAY-8a2116bd9d541c179d7bd4e611fe58b8",
    "bannerUrl": "https://t3.rbxcdn.com/180DAY-8a2116bd9d541c179d7bd4e611fe58b8",
    "genre": "Variety",
    "playerCount": 0,
    "totalVisits": "0",
    "rawVisits": 0,
    "favoritedCount": 0,
    "upVotes": 0,
    "downVotes": 0,
    "releaseYear": 2019,
    "ratingAverage": 4.5,
    "ratingCount": 0,
    "ratingHistogram": {
      "0.5": 0,
      "1.0": 0,
      "1.5": 0,
      "2.0": 0,
      "2.5": 0,
      "3.0": 0,
      "3.5": 0,
      "4.0": 0,
      "4.5": 0,
      "5.0": 0
    },
    "tags": [
      "tycoon---management",
      "roblox",
      "multiplayer",
      "tycoon"
    ]
  },
  {
    "id": "game-jujutsu-shenanigans",
    "universeId": 3508322461,
    "rootPlaceId": 9391468976,
    "name": "[SKY ASSASSIN] Jujutsu Shenanigans",
    "description": '"what are you doing" "im doing some jujutsu shenanigans" (tell that to your friends)  M1 - melee combo 1,2,3,4 - skills Q - dash (use in stun to escape) F - block R - special W+W - sprint (automatically avoids obstacles) G - awaken  combat based off many battleground games destruction inspired by co',
    "creatorName": "Tze's Shenanigans",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e27277bbda2ba2efdb47a1863df2da3d/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e27277bbda2ba2efdb47a1863df2da3d/512/512/Image/Png/noFilter",
    "genre": "Action",
    "playerCount": 157327,
    "totalVisits": "7.2B+",
    "rawVisits": 7189319413,
    "favoritedCount": 2976106,
    "upVotes": 2559639,
    "downVotes": 405902,
    "releaseYear": 2022,
    "ratingAverage": 4.2,
    "ratingCount": 2965541,
    "ratingHistogram": {
      "0.5": 81180,
      "1.0": 81180,
      "1.5": 60885,
      "2.0": 60885,
      "2.5": 60885,
      "3.0": 60885,
      "3.5": 127982,
      "4.0": 383946,
      "4.5": 639910,
      "5.0": 1407801
    },
    "tags": [
      "action---fighting",
      "roblox",
      "multiplayer",
      "jjs",
      "jujutsu shenanigans",
      "gojo",
      "sukuna"
    ],
    "subgenre": "Battlegrounds & Fighting",
    "genre_l1": "Action",
    "genre_l2": "Battlegrounds & Fighting"
  },
  {
    "id": "game-berry-avenue",
    "universeId": 3240075297,
    "rootPlaceId": 8481844229,
    "name": "Berry Avenue \u{1F3E0} RP",
    "description": "\u2B50 Welcome to Berry Avenue! A place to roleplay, hang out and explore! \u{1F353} Choose from a wide selection of stylish houses, cool cars & roleplay items to enhance your experience!  \u{1F3EB} Become a student at the High School \u{1F9D1}\u200D\u{1F3EB} \u{1F3EA} Work at the grocery store \u{1F954} \u{1F3E6} Rob the bank or become a police officer \u{1F6A8} ",
    "creatorName": "Amberry Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-0ad132d9a875993bc0c73af94dcebddb/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-0ad132d9a875993bc0c73af94dcebddb/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 38269,
    "totalVisits": "8.7B+",
    "rawVisits": 8704250351,
    "favoritedCount": 3589547,
    "upVotes": 1133795,
    "downVotes": 184338,
    "releaseYear": 2022,
    "ratingAverage": 4.2,
    "ratingCount": 1318133,
    "ratingHistogram": {
      "0.5": 36868,
      "1.0": 36868,
      "1.5": 27651,
      "2.0": 27651,
      "2.5": 27651,
      "3.0": 27651,
      "3.5": 56690,
      "4.0": 170069,
      "4.5": 283449,
      "5.0": 623587
    },
    "tags": [
      "social---roleplay",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Life",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Life"
  },
  {
    "id": "game-car-driving-indonesia",
    "universeId": 1749382609,
    "rootPlaceId": 5057064376,
    "name": "Car Driving Indonesia (CDID) \u{1F697}",
    "description": "This is your very first Roblox creation. Check it out, then make it your own with Roblox Studio!",
    "creatorName": "Pengemudi Handal",
    "creatorType": "User",
    "iconUrl": "https://t4.rbxcdn.com/180DAY-dc729135d7789ab11a92a9d761648577",
    "bannerUrl": "https://t4.rbxcdn.com/180DAY-dc729135d7789ab11a92a9d761648577",
    "genre": "Variety",
    "playerCount": 0,
    "totalVisits": "0",
    "rawVisits": 0,
    "favoritedCount": 0,
    "upVotes": 0,
    "downVotes": 0,
    "releaseYear": 2020,
    "ratingAverage": 4.5,
    "ratingCount": 0,
    "ratingHistogram": {
      "0.5": 0,
      "1.0": 0,
      "1.5": 0,
      "2.0": 0,
      "2.5": 0,
      "3.0": 0,
      "3.5": 0,
      "4.0": 0,
      "4.5": 0,
      "5.0": 0
    },
    "tags": [
      "simulation---driving",
      "roblox",
      "multiplayer",
      "cdid",
      "car driving indonesia"
    ]
  },
  {
    "id": "game-emergency-response",
    "universeId": 903807016,
    "rootPlaceId": 2534724415,
    "name": "Emergency Response: Liberty County",
    "description": "\u{1F694} Chase criminals, rescue civilians, race through the streets, and make a name for yourself in Liberty County!  Emergency Response: Liberty County is an emergency services simulation game. Play as a Civilian, criminal, transportation worker, police officer, sheriff deputy, or firefighter! On the ci",
    "creatorName": "Police Roleplay Community",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-878684cc2a3973ce1f37779de7a53ecf/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-878684cc2a3973ce1f37779de7a53ecf/512/512/Image/Png/noFilter",
    "genre": "Roleplay & Avatar Sim",
    "playerCount": 5958,
    "totalVisits": "1.6B+",
    "rawVisits": 1580121088,
    "favoritedCount": 2841439,
    "upVotes": 1179166,
    "downVotes": 118995,
    "releaseYear": 2018,
    "ratingAverage": 4.4,
    "ratingCount": 1298161,
    "ratingHistogram": {
      "0.5": 23799,
      "1.0": 23799,
      "1.5": 17849,
      "2.0": 17849,
      "2.5": 17849,
      "3.0": 17849,
      "3.5": 58958,
      "4.0": 176875,
      "4.5": 294792,
      "5.0": 648541
    },
    "tags": [
      "roleplay---police",
      "roblox",
      "multiplayer",
      "erlc",
      "emergency response",
      "liberty county",
      "police"
    ],
    "subgenre": "Life",
    "genre_l1": "Roleplay & Avatar Sim",
    "genre_l2": "Life"
  },
  {
    "id": "game-all-star-td",
    "universeId": 1720936166,
    "rootPlaceId": 4996049426,
    "name": "[OG] All Star Tower Defense",
    "description": "Check out the update board in the lobby or our socials for more information  \u2694\uFE0FUse your units to fend off waves of enemies \u26A1Each Unit has Unique Cool Abilities \u2B06\uFE0FUpgrade your Troops During battle to unlock new attacks \u26E9\uFE0FSummon from the Gate and unlock New Units to use them in battles \u{1F300}Team up with ",
    "creatorName": "Top Down Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-1041ffa20fc03c82a0d076a8f979d9bc/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-1041ffa20fc03c82a0d076a8f979d9bc/512/512/Image/Png/noFilter",
    "genre": "Strategy",
    "playerCount": 6895,
    "totalVisits": "7.9B+",
    "rawVisits": 7916008503,
    "favoritedCount": 2318396,
    "upVotes": 1493086,
    "downVotes": 129143,
    "releaseYear": 2020,
    "ratingAverage": 4.4,
    "ratingCount": 1622229,
    "ratingHistogram": {
      "0.5": 25829,
      "1.0": 25829,
      "1.5": 19371,
      "2.0": 19371,
      "2.5": 19371,
      "3.0": 19371,
      "3.5": 74654,
      "4.0": 223963,
      "4.5": 373272,
      "5.0": 821197
    },
    "tags": [
      "tower-defense",
      "roblox",
      "multiplayer",
      "astd",
      "all star tower defense"
    ],
    "subgenre": "Tower Defense",
    "genre_l1": "Strategy",
    "genre_l2": "Tower Defense"
  },
  {
    "id": "game-anime-last-stand",
    "universeId": 4509896324,
    "rootPlaceId": 12886143095,
    "name": "[\u2B1B\u{1F340} UPD + \u{1F4CA} x4] Anime Last Stand",
    "description": "\u{1F44D} LIKE the game for FREE Codes (THUMBS UP)  \u{1F310} JOIN community below for Updates \u{1F4F1} \u{1F4BB} \u{1F3AE} You can play on ALL DEVICES \u26E9\uFE0F \u{1F30E} One of the most if not the most CONTENT PACKED Tower Defense game in Roblox  Disclaimer: This project might or might not contain inspired content created out of admiration and ",
    "creatorName": "[B:S] ALS Team",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-9e233ae020d9b35a75ec67637b42d3b6/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-9e233ae020d9b35a75ec67637b42d3b6/512/512/Image/Png/noFilter",
    "genre": "Strategy",
    "playerCount": 106,
    "totalVisits": "1.1B+",
    "rawVisits": 1081370483,
    "favoritedCount": 707128,
    "upVotes": 984037,
    "downVotes": 45954,
    "releaseYear": 2023,
    "ratingAverage": 4.5,
    "ratingCount": 1029991,
    "ratingHistogram": {
      "0.5": 9191,
      "1.0": 9191,
      "1.5": 6893,
      "2.0": 6893,
      "2.5": 6893,
      "3.0": 6893,
      "3.5": 49202,
      "4.0": 147606,
      "4.5": 246009,
      "5.0": 541220
    },
    "tags": [
      "tower-defense",
      "roblox",
      "multiplayer",
      "als",
      "anime last stand"
    ],
    "subgenre": "Tower Defense",
    "genre_l1": "Strategy",
    "genre_l2": "Tower Defense"
  },
  {
    "id": "game-catalog-avatar",
    "universeId": 2711375305,
    "rootPlaceId": 7041939546,
    "name": "Catalog Avatar Creator",
    "description": "Catalog Avatar Creator allows you to try on many different avatar/catalog items for free. This includes accessories, hats, limiteds, hair combos, bundles, animation packs and more! You can also browse through an ever-growing collection of over 50M+ Community Created outfits, and save any avatars you",
    "creatorName": "Muneeb",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-4091747afd807e31c643fac0b3ad3448/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-4091747afd807e31c643fac0b3ad3448/512/512/Image/Png/noFilter",
    "genre": "Shopping",
    "playerCount": 68687,
    "totalVisits": "7.9B+",
    "rawVisits": 7865340511,
    "favoritedCount": 5784105,
    "upVotes": 2975292,
    "downVotes": 199376,
    "releaseYear": 2021,
    "ratingAverage": 4.5,
    "ratingCount": 3174668,
    "ratingHistogram": {
      "0.5": 39875,
      "1.0": 39875,
      "1.5": 29906,
      "2.0": 29906,
      "2.5": 29906,
      "3.0": 29906,
      "3.5": 148765,
      "4.0": 446294,
      "4.5": 743823,
      "5.0": 1636411
    },
    "tags": [
      "social---avatar",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Avatar Shopping",
    "genre_l1": "Shopping",
    "genre_l2": "Avatar Shopping"
  },
  {
    "id": "game-tower-heroes",
    "universeId": 1531130248,
    "rootPlaceId": 4646477729,
    "name": "\u{1F404} Tower Heroes [UPD]",
    "description": "Use code: MOO for a free skin!  What's New? - UFO Invasion Weekly! (Skin Reward + Map Gimmick + New Enemies) - UFO Sabotage - Backrooms Adventure Mode Theme - Quiet Quarry [Map] - Quarry Enemies - Quarry Skins - Grass Crate [Skin Crate] - Sandbox Gamepass now gives access to Test Map - Other Fixes  ",
    "creatorName": "Pixel-bit Studio",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-7c6195e487b29ae55d02c38b8cc09756/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-7c6195e487b29ae55d02c38b8cc09756/512/512/Image/Png/noFilter",
    "genre": "Strategy",
    "playerCount": 1350,
    "totalVisits": "528.5M+",
    "rawVisits": 528477347,
    "favoritedCount": 856800,
    "upVotes": 362197,
    "downVotes": 43462,
    "releaseYear": 2020,
    "ratingAverage": 4.3,
    "ratingCount": 405659,
    "ratingHistogram": {
      "0.5": 8692,
      "1.0": 8692,
      "1.5": 6519,
      "2.0": 6519,
      "2.5": 6519,
      "3.0": 6519,
      "3.5": 18110,
      "4.0": 54330,
      "4.5": 90549,
      "5.0": 199208
    },
    "tags": [
      "tower-defense",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Tower Defense",
    "genre_l1": "Strategy",
    "genre_l2": "Tower Defense"
  },
  {
    "id": "game-sharkbite-2",
    "universeId": 3734056789,
    "rootPlaceId": 10178703304,
    "name": "souyotuber9000's Place",
    "description": "This is your very first Roblox creation. Check it out, then make it your own with Roblox Studio!",
    "creatorName": "souyotuber9000",
    "creatorType": "User",
    "iconUrl": "https://t4.rbxcdn.com/180DAY-dc729135d7789ab11a92a9d761648577",
    "bannerUrl": "https://t4.rbxcdn.com/180DAY-dc729135d7789ab11a92a9d761648577",
    "genre": "Variety",
    "playerCount": 0,
    "totalVisits": "0",
    "rawVisits": 0,
    "favoritedCount": 0,
    "upVotes": 0,
    "downVotes": 0,
    "releaseYear": 2022,
    "ratingAverage": 4.5,
    "ratingCount": 0,
    "ratingHistogram": {
      "0.5": 0,
      "1.0": 0,
      "1.5": 0,
      "2.0": 0,
      "2.5": 0,
      "3.0": 0,
      "3.5": 0,
      "4.0": 0,
      "4.5": 0,
      "5.0": 0
    },
    "tags": [
      "survival---action",
      "roblox",
      "multiplayer"
    ]
  },
  {
    "id": "game-hide-and-seek",
    "universeId": 93740418,
    "rootPlaceId": 205224386,
    "name": "Hide and Seek Extreme",
    "description": "Welcome to Hide and Seek Extreme. At the start of the game, one player gets chosen to be 'It'. 'It' has to try and find the other players. 'It' will not spawn with their default character, instead they will spawn with their equipped 'It' character. Every 'It' character has a special ability that ca",
    "creatorName": "Tim7775",
    "creatorType": "User",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e50353797d125464767287770cafd602/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e50353797d125464767287770cafd602/512/512/Image/Png/noFilter",
    "genre": "Party & Casual",
    "playerCount": 2780,
    "totalVisits": "3.4B+",
    "rawVisits": 3415557235,
    "favoritedCount": 6934812,
    "upVotes": 985393,
    "downVotes": 96082,
    "releaseYear": 2015,
    "ratingAverage": 4.4,
    "ratingCount": 1081475,
    "ratingHistogram": {
      "0.5": 19216,
      "1.0": 19216,
      "1.5": 14412,
      "2.0": 14412,
      "2.5": 14412,
      "3.0": 14412,
      "3.5": 49270,
      "4.0": 147809,
      "4.5": 246348,
      "5.0": 541966
    },
    "tags": [
      "social---party",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Childhood Game",
    "genre_l1": "Party & Casual",
    "genre_l2": "Childhood Game"
  },
  {
    "id": "game-epic-minigames",
    "universeId": 110181652,
    "rootPlaceId": 277751860,
    "name": "Epic Minigames \u2728",
    "description": "Welcome to Epic Minigames, the game where you can enjoy a collection of 140 unique and exciting minigames! \u{1F579}\uFE0F  Level up and earn coins by winning rounds, and spend your coins on gear, pets, effects, and other fun stuff for your character. \u{1F31F}  As well as the main minigame mode, there's also Epic Par",
    "creatorName": "Typical Games",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-a7cb7bb15c8f29fcfcf39d83800a60df/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-a7cb7bb15c8f29fcfcf39d83800a60df/512/512/Image/Png/noFilter",
    "genre": "Party & Casual",
    "playerCount": 2425,
    "totalVisits": "2.4B+",
    "rawVisits": 2351221506,
    "favoritedCount": 8563859,
    "upVotes": 2266747,
    "downVotes": 235755,
    "releaseYear": 2015,
    "ratingAverage": 4.4,
    "ratingCount": 2502502,
    "ratingHistogram": {
      "0.5": 47151,
      "1.0": 47151,
      "1.5": 35363,
      "2.0": 35363,
      "2.5": 35363,
      "3.0": 35363,
      "3.5": 113337,
      "4.0": 340012,
      "4.5": 566687,
      "5.0": 1246711
    },
    "tags": [
      "party---minigames",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Minigame",
    "genre_l1": "Party & Casual",
    "genre_l2": "Minigame"
  },
  {
    "id": "game-rogue-lineage",
    "universeId": 1087859240,
    "rootPlaceId": 3016661674,
    "name": "[\u2600\uFE0F] Rogue Lineage",
    "description": '>> This game is incredibly difficult with little to no hand holding. Enter at your own risk. <<   Nominee for "Sleeper Hit" in the 7th Annual Bloxy Awards.   Rogue Lineage is a fantasy game with roguelike elements. The game revolves around a permadeath mechanic, where each of your characters will ha',
    "creatorName": "Rogue Lineage",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-e4f7aff307d47645c43eafae4a45d7c5/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-e4f7aff307d47645c43eafae4a45d7c5/512/512/Image/Png/noFilter",
    "genre": "RPG",
    "playerCount": 707,
    "totalVisits": "384.4M+",
    "rawVisits": 384368432,
    "favoritedCount": 343923,
    "upVotes": 118454,
    "downVotes": 23270,
    "releaseYear": 2019,
    "ratingAverage": 4.2,
    "ratingCount": 141724,
    "ratingHistogram": {
      "0.5": 4654,
      "1.0": 4654,
      "1.5": 3491,
      "2.0": 3491,
      "2.5": 3491,
      "3.0": 3491,
      "3.5": 5923,
      "4.0": 17768,
      "4.5": 29614,
      "5.0": 65150
    },
    "tags": [
      "hardcore-rpg",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Action RPG",
    "genre_l1": "RPG",
    "genre_l2": "Action RPG"
  },
  {
    "id": "game-phighting",
    "universeId": 1350874835,
    "rootPlaceId": 4056244170,
    "name": "tyre4life2's Place",
    "description": "This is your very first Roblox creation. Check it out, then make it your own with Roblox Studio!",
    "creatorName": "tyre4life2",
    "creatorType": "User",
    "iconUrl": "https://t4.rbxcdn.com/180DAY-c86b7d253016e3d58e6a91a13f62dab7",
    "bannerUrl": "https://t4.rbxcdn.com/180DAY-c86b7d253016e3d58e6a91a13f62dab7",
    "genre": "Variety",
    "playerCount": 0,
    "totalVisits": "0",
    "rawVisits": 0,
    "favoritedCount": 0,
    "upVotes": 0,
    "downVotes": 0,
    "releaseYear": 2019,
    "ratingAverage": 4.5,
    "ratingCount": 0,
    "ratingHistogram": {
      "0.5": 0,
      "1.0": 0,
      "1.5": 0,
      "2.0": 0,
      "2.5": 0,
      "3.0": 0,
      "3.5": 0,
      "4.0": 0,
      "4.5": 0,
      "5.0": 0
    },
    "tags": [
      "action---arena",
      "roblox",
      "multiplayer"
    ]
  },
  {
    "id": "game-frontlines",
    "universeId": 2132866904,
    "rootPlaceId": 5938036553,
    "name": "FRONTLINES",
    "description": 'The classic FPS experience that redefined Roblox.   Type "/votekick [player name]" in chat to kick hackers, etc. Press "esc" and manually turn graphics down to 1-3 for better performance.',
    "creatorName": "MAXIMILLIAN",
    "creatorType": "Group",
    "iconUrl": "https://tr.rbxcdn.com/180DAY-3fab2edac3adb6050f42d3292937f9d8/512/512/Image/Png/noFilter",
    "bannerUrl": "https://tr.rbxcdn.com/180DAY-3fab2edac3adb6050f42d3292937f9d8/512/512/Image/Png/noFilter",
    "genre": "Shooter",
    "playerCount": 308,
    "totalVisits": "210.7M+",
    "rawVisits": 210740638,
    "favoritedCount": 1666179,
    "upVotes": 470331,
    "downVotes": 70404,
    "releaseYear": 2020,
    "ratingAverage": 4.3,
    "ratingCount": 540735,
    "ratingHistogram": {
      "0.5": 14081,
      "1.0": 14081,
      "1.5": 10561,
      "2.0": 10561,
      "2.5": 10561,
      "3.0": 10561,
      "3.5": 23517,
      "4.0": 70550,
      "4.5": 117583,
      "5.0": 258682
    },
    "tags": [
      "fps---tactical",
      "roblox",
      "multiplayer"
    ],
    "subgenre": "Deathmatch Shooter",
    "genre_l1": "Shooter",
    "genre_l2": "Deathmatch Shooter"
  },
  {
    "id": "game-total-drama",
    "universeId": 4168973058,
    "rootPlaceId": 11776823908,
    "name": "se\uC2A4 ",
    "description": "Total Roblox Drama on Roblox by tchs4141.",
    "creatorName": "tchs4141",
    "creatorType": "User",
    "iconUrl": "https://t0.rbxcdn.com/180DAY-6b0a0f92f70c7748c90fb3d90dc56234",
    "bannerUrl": "https://t0.rbxcdn.com/180DAY-6b0a0f92f70c7748c90fb3d90dc56234",
    "genre": "Variety",
    "playerCount": 0,
    "totalVisits": "0",
    "rawVisits": 0,
    "favoritedCount": 0,
    "upVotes": 0,
    "downVotes": 0,
    "releaseYear": 2022,
    "ratingAverage": 4.5,
    "ratingCount": 0,
    "ratingHistogram": {
      "0.5": 0,
      "1.0": 0,
      "1.5": 0,
      "2.0": 0,
      "2.5": 0,
      "3.0": 0,
      "3.5": 0,
      "4.0": 0,
      "4.5": 0,
      "5.0": 0
    },
    "tags": [
      "social---reality-tv",
      "roblox",
      "multiplayer"
    ]
  }
];

// src/db/index.ts
dotenv.config();
var cleanEnv = (val) => val ? val.trim().replace(/^["']|["']$/g, "") : void 0;
var tursoUrl = cleanEnv(process.env.TURSO_DATABASE_URL);
var tursoToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);
var isTursoCloud = Boolean(
  tursoUrl && (tursoUrl.startsWith("libsql://") || tursoUrl.startsWith("https://"))
);
var localDbPath = process.env.VERCEL ? path.join("/tmp", "bloxboxd.db") : path.join(process.cwd(), "bloxboxd.db");
var db = createClient({
  url: isTursoCloud ? tursoUrl : `file:${localDbPath}`,
  authToken: isTursoCloud ? tursoToken : void 0
});
console.log(
  isTursoCloud ? `[Database] Connected to Turso Cloud at ${tursoUrl}` : `[Database] Connected to Local SQLite database at ${localDbPath}`
);
async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      verified_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      roblox_user_id INTEGER UNIQUE,
      username TEXT NOT NULL,
      handle TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      avatar_bust_url TEXT,
      bio TEXT,
      joined_date TEXT,
      roblox_joined_date TEXT,
      friends_count INTEGER DEFAULT 0,
      favorite_game_ids TEXT DEFAULT '[]'
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      status TEXT NOT NULL,
      rating REAL,
      review_text TEXT,
      has_spoilers INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      is_liked INTEGER DEFAULT 0,
      logged_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, game_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      game_title TEXT NOT NULL,
      game_icon TEXT,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      user_avatar TEXT,
      rating REAL,
      review_text TEXT NOT NULL,
      has_spoilers INTEGER DEFAULT 0,
      is_liked INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      logged_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_avatar TEXT,
      title TEXT NOT NULL,
      description TEXT,
      is_ranked INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 1,
      items TEXT NOT NULL DEFAULT '[]',
      likes_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_likes (
      user_id TEXT NOT NULL,
      review_id TEXT NOT NULL,
      PRIMARY KEY(user_id, review_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS list_likes (
      user_id TEXT NOT NULL,
      list_id TEXT NOT NULL,
      PRIMARY KEY(user_id, list_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(follower_id, following_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_comments (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      user_avatar TEXT,
      comment_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      universe_id INTEGER,
      root_place_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      creator_name TEXT,
      creator_type TEXT,
      icon_url TEXT,
      banner_url TEXT,
      genre TEXT,
      player_count INTEGER DEFAULT 0,
      total_visits TEXT,
      raw_visits INTEGER DEFAULT 0,
      favorited_count INTEGER DEFAULT 0,
      up_votes INTEGER DEFAULT 0,
      down_votes INTEGER DEFAULT 0,
      release_year INTEGER,
      rating_average REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      rating_histogram TEXT DEFAULT '{}',
      tags TEXT DEFAULT '[]',
      updated_at INTEGER
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_games_universe_id ON games(universe_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_games_root_place_id ON games(root_place_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_game_logs_user_date ON game_logs(user_id, logged_date DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs(game_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_game_created ON reviews(game_id, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_trending ON reviews(likes_count DESC, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_custom_lists_public_created ON custom_lists(is_public, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_list_likes_list_id ON list_likes(list_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_review_comments_review_created ON review_comments(review_id, created_at ASC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username)`);
  try {
    const gameCountRes = await db.execute("SELECT COUNT(*) as count FROM games");
    const gameCount = Number(gameCountRes.rows[0]?.count || 0);
    if (gameCount === 0 && INITIAL_GAMES.length > 0) {
      console.log(`[Database] Seeding ${INITIAL_GAMES.length} initial games into database...`);
      await bulkUpsertGames(INITIAL_GAMES);
      console.log(`[Database] Seeded initial games successfully.`);
    }
  } catch (err) {
    console.warn("[Database] Failed to check/seed initial games:", err);
  }
  const legacyAccountsFile = path.join(process.cwd(), "src/data/registeredAccounts.json");
  if (fs.existsSync(legacyAccountsFile)) {
    try {
      const legacyData = JSON.parse(fs.readFileSync(legacyAccountsFile, "utf8"));
      for (const [key, val] of Object.entries(legacyData)) {
        if (val && val.userId && val.pinHash) {
          await db.execute({
            sql: `
              INSERT OR IGNORE INTO accounts (user_id, username, pin_hash, salt, verified_at)
              VALUES (?, ?, ?, ?, ?)
            `,
            args: [val.userId, val.username || "RobloxPlayer", val.pinHash, val.salt || "", val.verifiedAt || (/* @__PURE__ */ new Date()).toISOString()]
          });
        }
      }
      console.log("[Database] Legacy registeredAccounts.json migrated to database.");
    } catch (err) {
      console.warn("[Database] Failed to migrate legacy accounts:", err);
    }
  }
}
async function getAccountByUserId(userId) {
  const result = await db.execute({
    sql: "SELECT user_id as userId, username, pin_hash as pinHash, salt, verified_at as verifiedAt FROM accounts WHERE user_id = ?",
    args: [userId]
  });
  if (result.rows.length === 0) return null;
  return result.rows[0];
}
async function saveAccount(data) {
  await db.execute({
    sql: `
      INSERT INTO accounts (user_id, username, pin_hash, salt, verified_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        pin_hash = excluded.pin_hash,
        salt = excluded.salt,
        verified_at = excluded.verified_at
    `,
    args: [data.userId, data.username, data.pinHash, data.salt, data.verifiedAt]
  });
}
async function getUserProfile(userId) {
  const result = await db.execute({
    sql: `SELECT * FROM user_profiles WHERE id = ? OR roblox_user_id = ?`,
    args: [userId, isNaN(Number(userId)) ? -1 : Number(userId)]
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    robloxUserId: row.roblox_user_id,
    username: row.username,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarBustUrl: row.avatar_bust_url,
    bio: row.bio,
    joinedDate: row.joined_date,
    robloxJoinedDate: row.roblox_joined_date,
    friendsCount: row.friends_count,
    favoriteGameIds: row.favorite_game_ids ? JSON.parse(row.favorite_game_ids) : []
  };
}
async function upsertUserProfile(profile) {
  const favJson = JSON.stringify(profile.favoriteGameIds || []);
  await db.execute({
    sql: `
      INSERT INTO user_profiles (
        id, roblox_user_id, username, handle, display_name, avatar_url,
        avatar_bust_url, bio, joined_date, roblox_joined_date, friends_count, favorite_game_ids
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        handle = excluded.handle,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        avatar_bust_url = excluded.avatar_bust_url,
        bio = excluded.bio,
        friends_count = excluded.friends_count,
        favorite_game_ids = excluded.favorite_game_ids
    `,
    args: [
      profile.id,
      profile.robloxUserId || null,
      profile.username,
      profile.handle || `@${profile.username}`,
      profile.robloxDisplayName || profile.displayName || profile.username,
      profile.avatarUrl || "",
      profile.avatarBustUrl || "",
      profile.bio || "",
      profile.joinedDate || (/* @__PURE__ */ new Date()).toISOString(),
      profile.robloxJoinedDate || "",
      profile.robloxFriendsCount ?? profile.friendsCount ?? 0,
      favJson
    ]
  });
  const effectiveUsername = profile.robloxDisplayName || profile.displayName || profile.username;
  const effectiveAvatar = profile.avatarUrl || "";
  const rawRobloxId = profile.robloxUserId ? String(profile.robloxUserId) : "";
  const prefixedId = profile.id.startsWith("user-roblox-") ? profile.id : `user-roblox-${profile.id}`;
  try {
    if (effectiveAvatar) {
      await db.execute({
        sql: `UPDATE reviews SET username = ?, user_avatar = ? WHERE user_id = ? OR user_id = ? OR user_id = ?`,
        args: [effectiveUsername, effectiveAvatar, profile.id, prefixedId, rawRobloxId]
      });
      await db.execute({
        sql: `UPDATE custom_lists SET user_name = ?, user_avatar = ? WHERE user_id = ? OR user_id = ? OR user_id = ?`,
        args: [effectiveUsername, effectiveAvatar, profile.id, prefixedId, rawRobloxId]
      });
      await db.execute({
        sql: `UPDATE review_comments SET username = ?, user_avatar = ? WHERE user_id = ? OR user_id = ? OR user_id = ?`,
        args: [effectiveUsername, effectiveAvatar, profile.id, prefixedId, rawRobloxId]
      });
    }
  } catch (e) {
    console.warn("[Database] Failed to cascade profile updates to reviews/lists:", e);
  }
}
async function searchUserProfiles(query, limit = 8) {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];
  const pattern = `%${cleanQ}%`;
  const result = await db.execute({
    sql: `
      SELECT id, roblox_user_id, username, handle, display_name, avatar_url, avatar_bust_url, bio, joined_date, friends_count
      FROM user_profiles
      WHERE LOWER(username) LIKE ? OR LOWER(handle) LIKE ? OR LOWER(display_name) LIKE ?
      LIMIT ?
    `,
    args: [pattern, pattern, pattern, limit]
  });
  return result.rows.map((row) => ({
    id: row.id,
    robloxUserId: row.roblox_user_id,
    username: row.username,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarBustUrl: row.avatar_bust_url,
    bio: row.bio || "",
    joinedDate: row.joined_date,
    friendsCount: row.friends_count || 0
  }));
}
async function getUserGameLogs(userId) {
  const cleanId = (userId || "").trim();
  const rawNumId = cleanId.replace("user-roblox-", "");
  const prefixedId = cleanId.startsWith("user-roblox-") ? cleanId : `user-roblox-${cleanId}`;
  const result = await db.execute({
    sql: `SELECT * FROM game_logs WHERE user_id = ? OR user_id = ? OR user_id = ? ORDER BY logged_date DESC, updated_at DESC`,
    args: [cleanId, rawNumId, prefixedId]
  });
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    status: row.status,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text || void 0,
    hasSpoilers: Boolean(row.has_spoilers),
    isFavorite: Boolean(row.is_favorite),
    isLiked: Boolean(row.is_liked),
    loggedDate: row.logged_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
async function upsertGameLog(log) {
  await db.execute({
    sql: `
      INSERT INTO game_logs (
        id, user_id, game_id, status, rating, review_text, has_spoilers,
        is_favorite, is_liked, logged_date, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, game_id) DO UPDATE SET
        status = excluded.status,
        rating = excluded.rating,
        review_text = excluded.review_text,
        has_spoilers = excluded.has_spoilers,
        is_favorite = excluded.is_favorite,
        is_liked = excluded.is_liked,
        logged_date = excluded.logged_date,
        updated_at = excluded.updated_at
    `,
    args: [
      log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      log.userId,
      log.gameId,
      log.status,
      log.rating ?? null,
      log.reviewText ?? null,
      log.hasSpoilers ? 1 : 0,
      log.isFavorite ? 1 : 0,
      log.isLiked ? 1 : 0,
      log.loggedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      log.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      log.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    ]
  });
}
async function deleteGameLog(userId, logId) {
  const cleanId = (userId || "").trim();
  const rawNumId = cleanId.replace("user-roblox-", "");
  const prefixedId = cleanId.startsWith("user-roblox-") ? cleanId : `user-roblox-${cleanId}`;
  await db.execute({
    sql: `DELETE FROM game_logs WHERE id = ? AND (user_id = ? OR user_id = ? OR user_id = ?)`,
    args: [logId, cleanId, rawNumId, prefixedId]
  });
}
async function getAllReviews(gameId) {
  const sql = gameId ? `SELECT r.*, 
         COALESCE(p.display_name, p.username, r.username) as live_username,
         COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
         (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
       FROM reviews r 
       LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
       WHERE r.game_id = ? 
       ORDER BY r.created_at DESC LIMIT 100` : `SELECT r.*, 
         COALESCE(p.display_name, p.username, r.username) as live_username,
         COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
         (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
       FROM reviews r 
       LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
       ORDER BY r.created_at DESC LIMIT 100`;
  const args = gameId ? [gameId] : [];
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}
async function getUserReviews(userId) {
  const cleanId = (userId || "").trim();
  const rawNumId = cleanId.replace("user-roblox-", "");
  const prefixedId = cleanId.startsWith("user-roblox-") ? cleanId : `user-roblox-${cleanId}`;
  const result = await db.execute({
    sql: `SELECT r.*, 
            COALESCE(p.display_name, p.username, r.username) as live_username,
            COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
            (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
          FROM reviews r 
          LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
          WHERE r.user_id = ? OR r.user_id = ? OR r.user_id = ? 
          ORDER BY r.created_at DESC LIMIT 100`,
    args: [cleanId, rawNumId, prefixedId]
  });
  return result.rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}
async function upsertReview(rev) {
  await db.execute({
    sql: `
      INSERT INTO reviews (
        id, game_id, game_title, game_icon, user_id, username,
        user_avatar, rating, review_text, has_spoilers, is_liked,
        likes_count, logged_date, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        rating = excluded.rating,
        review_text = excluded.review_text,
        has_spoilers = excluded.has_spoilers,
        is_liked = excluded.is_liked,
        logged_date = excluded.logged_date
      WHERE reviews.user_id = excluded.user_id
    `,
    args: [
      rev.id || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rev.gameId,
      rev.gameTitle || "",
      rev.gameIcon || "",
      rev.userId,
      rev.username,
      rev.userAvatar || "",
      rev.rating ?? null,
      rev.reviewText,
      rev.hasSpoilers ? 1 : 0,
      rev.isLiked ? 1 : 0,
      rev.likesCount || 0,
      rev.loggedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      rev.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    ]
  });
}
async function toggleReviewLike(userId, reviewId) {
  const existing = await db.execute({
    sql: `SELECT 1 FROM review_likes WHERE user_id = ? AND review_id = ?`,
    args: [userId, reviewId]
  });
  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM review_likes WHERE user_id = ? AND review_id = ?`,
      args: [userId, reviewId]
    });
    await db.execute({
      sql: `UPDATE reviews SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
      args: [reviewId]
    });
    const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
    return { liked: false, likesCount: Number(rev.rows[0]?.likes_count || 0) };
  } else {
    await db.execute({
      sql: `INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)`,
      args: [userId, reviewId]
    });
    await db.execute({
      sql: `UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?`,
      args: [reviewId]
    });
    const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
    return { liked: true, likesCount: Number(rev.rows[0]?.likes_count || 1) };
  }
}
async function getAllCustomLists() {
  const result = await db.execute(`
    SELECT l.*,
           COALESCE(p.display_name, p.username, l.user_name) as live_username,
           COALESCE(p.avatar_url, l.user_avatar) as live_avatar
    FROM custom_lists l
    LEFT JOIN user_profiles p ON (p.id = l.user_id OR p.roblox_user_id = l.user_id)
    WHERE l.is_public = 1 
    ORDER BY l.created_at DESC LIMIT 100
  `);
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.live_username || row.user_name,
    userAvatar: row.live_avatar || row.user_avatar,
    title: row.title,
    description: row.description,
    isRanked: Boolean(row.is_ranked),
    isPublic: Boolean(row.is_public),
    likesCount: Number(row.likes_count) || 0,
    items: row.items ? JSON.parse(row.items) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
async function upsertCustomList(list) {
  const itemsJson = JSON.stringify(list.items || []);
  await db.execute({
    sql: `
      INSERT INTO custom_lists (
        id, user_id, user_name, user_avatar, title, description,
        is_ranked, is_public, items, likes_count, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        is_ranked = excluded.is_ranked,
        is_public = excluded.is_public,
        items = excluded.items
      WHERE custom_lists.user_id = excluded.user_id
    `,
    args: [
      list.id || `list-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      list.userId,
      list.userName,
      list.userAvatar || "",
      list.title,
      list.description || "",
      list.isRanked ? 1 : 0,
      list.isPublic !== false ? 1 : 0,
      itemsJson,
      list.likesCount || 0,
      list.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    ]
  });
}
async function deleteCustomList(userId, listId) {
  await db.execute({
    sql: `DELETE FROM custom_lists WHERE id = ? AND user_id = ?`,
    args: [listId, userId]
  });
}
async function toggleListLike(userId, listId) {
  const existing = await db.execute({
    sql: `SELECT 1 FROM list_likes WHERE user_id = ? AND list_id = ?`,
    args: [userId, listId]
  });
  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM list_likes WHERE user_id = ? AND list_id = ?`,
      args: [userId, listId]
    });
    await db.execute({
      sql: `UPDATE custom_lists SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
      args: [listId]
    });
    const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
    return { liked: false, likesCount: Number(item.rows[0]?.likes_count || 0) };
  } else {
    await db.execute({
      sql: `INSERT INTO list_likes (user_id, list_id) VALUES (?, ?)`,
      args: [userId, listId]
    });
    await db.execute({
      sql: `UPDATE custom_lists SET likes_count = likes_count + 1 WHERE id = ?`,
      args: [listId]
    });
    const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
    return { liked: true, likesCount: Number(item.rows[0]?.likes_count || 1) };
  }
}
async function toggleFollowUser(followerId, followingId) {
  const existing = await db.execute({
    sql: `SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?`,
    args: [followerId, followingId]
  });
  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
      args: [followerId, followingId]
    });
  } else {
    await db.execute({
      sql: `INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`,
      args: [followerId, followingId, (/* @__PURE__ */ new Date()).toISOString()]
    });
  }
  return getFollowStatus(followerId, followingId);
}
async function getFollowStatus(currentUserId, targetUserId) {
  const isFollowingRes = currentUserId ? await db.execute({
    sql: `SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?`,
    args: [currentUserId, targetUserId]
  }) : { rows: [] };
  const followersRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
    args: [targetUserId]
  });
  const followingRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
    args: [targetUserId]
  });
  return {
    isFollowing: isFollowingRes.rows.length > 0,
    followersCount: Number(followersRes.rows[0]?.count || 0),
    followingCount: Number(followingRes.rows[0]?.count || 0)
  };
}
async function getCommunityFeed(userId) {
  const reviewsRes = await db.execute(`
    SELECT r.id, r.game_id, r.game_title, r.game_icon, r.user_id,
           COALESCE(p.display_name, p.username, r.username) as username,
           COALESCE(p.avatar_url, r.user_avatar) as user_avatar,
           r.rating, r.review_text, r.likes_count, r.created_at,
           'review' as activity_type
    FROM reviews r
    LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
    ORDER BY r.created_at DESC LIMIT 30
  `);
  const listsRes = await db.execute(`
    SELECT l.id, l.user_id,
           COALESCE(p.display_name, p.username, l.user_name) as username,
           COALESCE(p.avatar_url, l.user_avatar) as user_avatar,
           l.title, l.description, l.items, l.likes_count, l.created_at,
           'list' as activity_type
    FROM custom_lists l
    LEFT JOIN user_profiles p ON (p.id = l.user_id OR p.roblox_user_id = l.user_id)
    WHERE l.is_public = 1
    ORDER BY l.created_at DESC LIMIT 20
  `);
  const activities = [];
  for (const r of reviewsRes.rows) {
    activities.push({
      id: `act-rev-${r.id}`,
      type: "review",
      userId: r.user_id,
      username: r.username,
      userAvatar: r.user_avatar,
      gameId: r.game_id,
      gameTitle: r.game_title,
      gameIcon: r.game_icon,
      rating: r.rating !== null ? Number(r.rating) : void 0,
      text: r.review_text,
      likesCount: Number(r.likes_count) || 0,
      createdAt: r.created_at
    });
  }
  for (const l of listsRes.rows) {
    const items = l.items ? JSON.parse(l.items) : [];
    activities.push({
      id: `act-list-${l.id}`,
      type: "list",
      userId: l.user_id,
      username: l.username,
      userAvatar: l.user_avatar,
      listId: l.id,
      title: l.title,
      description: l.description,
      itemCount: items.length,
      likesCount: Number(l.likes_count) || 0,
      createdAt: l.created_at
    });
  }
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return activities.slice(0, 40);
}
async function getTrendingReviewsAndLeaderboard() {
  const trendingRes = await db.execute(`
    SELECT r.*,
           COALESCE(p.display_name, p.username, r.username) as live_username,
           COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
           (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count
    FROM reviews r
    LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
    ORDER BY r.likes_count DESC, r.created_at DESC LIMIT 8
  `);
  const trendingReviews = trendingRes.rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text,
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
  const leadRes = await db.execute(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
           COUNT(DISTINCT l.id) as logs_count,
           COUNT(DISTINCT r.id) as reviews_count
    FROM user_profiles u
    LEFT JOIN game_logs l ON l.user_id = u.id
    LEFT JOIN reviews r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT r.id) * 2) DESC
    LIMIT 10
  `);
  const leaderboard = leadRes.rows.map((row, idx) => ({
    rank: idx + 1,
    id: row.id,
    username: row.display_name || row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    logsCount: Number(row.logs_count) || 0,
    reviewsCount: Number(row.reviews_count) || 0,
    score: (Number(row.logs_count) || 0) + (Number(row.reviews_count) || 0) * 2
  }));
  return { trendingReviews, leaderboard };
}
async function getReviewComments(reviewId) {
  const result = await db.execute({
    sql: `SELECT rc.*,
            COALESCE(p.display_name, p.username, rc.username) as live_username,
            COALESCE(p.avatar_url, rc.user_avatar) as live_avatar
          FROM review_comments rc
          LEFT JOIN user_profiles p ON (p.id = rc.user_id OR p.roblox_user_id = rc.user_id)
          WHERE rc.review_id = ? 
          ORDER BY rc.created_at ASC`,
    args: [reviewId]
  });
  return result.rows.map((r) => ({
    id: r.id,
    reviewId: r.review_id,
    userId: r.user_id,
    username: r.live_username || r.username,
    userAvatar: r.live_avatar || r.user_avatar,
    commentText: r.comment_text,
    createdAt: r.created_at
  }));
}
async function addReviewComment(comment) {
  const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: `
      INSERT INTO review_comments (id, review_id, user_id, username, user_avatar, comment_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, comment.reviewId, comment.userId, comment.username, comment.userAvatar || "", comment.commentText, now]
  });
  return {
    id,
    reviewId: comment.reviewId,
    userId: comment.userId,
    username: comment.username,
    userAvatar: comment.userAvatar || "",
    commentText: comment.commentText,
    createdAt: now
  };
}
function mapRowToGame(row) {
  let ratingHistogram = {};
  if (row.rating_histogram) {
    try {
      ratingHistogram = typeof row.rating_histogram === "string" ? JSON.parse(row.rating_histogram) : row.rating_histogram;
    } catch (e) {
      ratingHistogram = {};
    }
  }
  let tags = [];
  if (row.tags) {
    try {
      tags = typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags;
    } catch (e) {
      tags = [];
    }
  }
  return {
    id: row.id,
    universeId: Number(row.universe_id) || 0,
    rootPlaceId: Number(row.root_place_id) || 0,
    name: row.name,
    description: row.description || "",
    creatorName: row.creator_name || "Roblox Creator",
    creatorType: row.creator_type || "Group",
    iconUrl: row.icon_url || "",
    bannerUrl: row.banner_url || void 0,
    genre: row.genre || "Adventure",
    playerCount: Number(row.player_count) || 0,
    totalVisits: row.total_visits || "0",
    rawVisits: Number(row.raw_visits) || 0,
    favoritedCount: Number(row.favorited_count) || 0,
    upVotes: Number(row.up_votes) || 0,
    downVotes: Number(row.down_votes) || 0,
    releaseYear: Number(row.release_year) || (/* @__PURE__ */ new Date()).getFullYear(),
    ratingAverage: Number(row.rating_average) || 4.5,
    ratingCount: Number(row.rating_count) || 0,
    ratingHistogram,
    tags: Array.isArray(tags) ? tags : []
  };
}
async function getAllGames(limit = 500) {
  const result = await db.execute({
    sql: "SELECT * FROM games ORDER BY player_count DESC, updated_at DESC LIMIT ?",
    args: [limit]
  });
  return result.rows.map(mapRowToGame);
}
async function getGameById(id) {
  const numId = isNaN(Number(id)) ? -1 : Number(id);
  const result = await db.execute({
    sql: "SELECT * FROM games WHERE id = ? OR universe_id = ? OR root_place_id = ? LIMIT 1",
    args: [id, numId, numId]
  });
  if (result.rows.length === 0) return null;
  return mapRowToGame(result.rows[0]);
}
async function upsertGame(g) {
  const ratingHistJson = JSON.stringify(g.ratingHistogram || {});
  const tagsJson = JSON.stringify(g.tags || []);
  const now = Date.now();
  await db.execute({
    sql: `
      INSERT INTO games (
        id, universe_id, root_place_id, name, description, creator_name, creator_type,
        icon_url, banner_url, genre, player_count, total_visits, raw_visits,
        favorited_count, up_votes, down_votes, release_year, rating_average,
        rating_count, rating_histogram, tags, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        universe_id = COALESCE(excluded.universe_id, games.universe_id),
        root_place_id = COALESCE(excluded.root_place_id, games.root_place_id),
        name = excluded.name,
        description = excluded.description,
        creator_name = excluded.creator_name,
        creator_type = excluded.creator_type,
        icon_url = excluded.icon_url,
        banner_url = COALESCE(excluded.banner_url, games.banner_url),
        genre = excluded.genre,
        player_count = excluded.player_count,
        total_visits = excluded.total_visits,
        raw_visits = excluded.raw_visits,
        favorited_count = excluded.favorited_count,
        up_votes = excluded.up_votes,
        down_votes = excluded.down_votes,
        release_year = excluded.release_year,
        rating_average = excluded.rating_average,
        rating_count = excluded.rating_count,
        rating_histogram = excluded.rating_histogram,
        tags = excluded.tags,
        updated_at = excluded.updated_at
    `,
    args: [
      g.id,
      g.universeId || null,
      g.rootPlaceId || null,
      g.name,
      g.description || "",
      g.creatorName || "Roblox Creator",
      g.creatorType || "Group",
      g.iconUrl || "",
      g.bannerUrl || null,
      g.genre || "Adventure",
      g.playerCount || 0,
      g.totalVisits || "0",
      g.rawVisits || 0,
      g.favoritedCount || 0,
      g.upVotes || 0,
      g.downVotes || 0,
      g.releaseYear || (/* @__PURE__ */ new Date()).getFullYear(),
      g.ratingAverage || 0,
      g.ratingCount || 0,
      ratingHistJson,
      tagsJson,
      now
    ]
  });
}
async function bulkUpsertGames(games) {
  if (!games || games.length === 0) return;
  const BATCH_SIZE = 25;
  const now = Date.now();
  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    const chunk = games.slice(i, i + BATCH_SIZE);
    const statements = chunk.map((g) => ({
      sql: `
        INSERT INTO games (
          id, universe_id, root_place_id, name, description, creator_name, creator_type,
          icon_url, banner_url, genre, player_count, total_visits, raw_visits,
          favorited_count, up_votes, down_votes, release_year, rating_average,
          rating_count, rating_histogram, tags, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          universe_id = COALESCE(excluded.universe_id, games.universe_id),
          root_place_id = COALESCE(excluded.root_place_id, games.root_place_id),
          name = excluded.name,
          description = excluded.description,
          creator_name = excluded.creator_name,
          creator_type = excluded.creator_type,
          icon_url = excluded.icon_url,
          banner_url = COALESCE(excluded.banner_url, games.banner_url),
          genre = excluded.genre,
          player_count = excluded.player_count,
          total_visits = excluded.total_visits,
          raw_visits = excluded.raw_visits,
          favorited_count = excluded.favorited_count,
          up_votes = excluded.up_votes,
          down_votes = excluded.down_votes,
          release_year = excluded.release_year,
          rating_average = excluded.rating_average,
          rating_count = excluded.rating_count,
          rating_histogram = excluded.rating_histogram,
          tags = excluded.tags,
          updated_at = excluded.updated_at
      `,
      args: [
        g.id,
        g.universeId || null,
        g.rootPlaceId || null,
        g.name,
        g.description || "",
        g.creatorName || "Roblox Creator",
        g.creatorType || "Group",
        g.iconUrl || "",
        g.bannerUrl || null,
        g.genre || "Adventure",
        g.playerCount || 0,
        g.totalVisits || "0",
        g.rawVisits || 0,
        g.favoritedCount || 0,
        g.upVotes || 0,
        g.downVotes || 0,
        g.releaseYear || (/* @__PURE__ */ new Date()).getFullYear(),
        g.ratingAverage || 0,
        g.ratingCount || 0,
        JSON.stringify(g.ratingHistogram || {}),
        JSON.stringify(g.tags || []),
        now
      ]
    }));
    try {
      await db.batch(statements, "write");
    } catch (e) {
      console.warn("[Database] batch upsert chunk error, falling back to sequential:", e);
      for (const stmt of statements) {
        try {
          await db.execute(stmt);
        } catch (singleErr) {
          console.warn("[Database] Failed to upsert single game:", singleErr);
        }
      }
    }
  }
}

// server.ts
var app = express();
var PORT = 3e3;
var originalFetch = globalThis.fetch;
globalThis.fetch = async function(input, init) {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input?.url || "";
  if (urlStr.includes(".roblox.com")) {
    try {
      const res = await originalFetch(input, init);
      if (res.ok || res.status !== 403 && res.status !== 429) {
        return res;
      }
    } catch (e) {
    }
    const proxyUrl = urlStr.replace("https://games.roblox.com", "https://games.roproxy.com").replace("https://thumbnails.roblox.com", "https://thumbnails.roproxy.com").replace("https://users.roblox.com", "https://users.roproxy.com").replace("https://apis.roblox.com", "https://apis.roproxy.com").replace("https://friends.roblox.com", "https://friends.roproxy.com");
    return originalFetch(proxyUrl, init);
  }
  return originalFetch(input, init);
};
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' data:; img-src 'self' data: blob: https://*.rbxcdn.com https://tr.rbxcdn.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://apis.roblox.com https://apis.roproxy.com https://games.roblox.com https://thumbnails.roblox.com https://*.turso.io;"
  );
  next();
});
var isDbInitialized = false;
var dbInitPromise = null;
app.use(async (req, res, next) => {
  const rawUrl = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"] || req.originalUrl;
  if (typeof rawUrl === "string" && rawUrl.startsWith("/api")) {
    req.url = rawUrl;
  }
  if (!isDbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase().then(() => {
        isDbInitialized = true;
      }).catch((err) => {
        console.error("[Database Init Error]:", err);
        isDbInitialized = true;
      });
    }
    await dbInitPromise;
  }
  next();
});
app.get("/favicon.ico", (req, res) => {
  const iconPath = path2.join(process.cwd(), "public/favicon.svg");
  if (fs2.existsSync(iconPath)) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.sendFile(iconPath);
  }
  return res.status(404).end();
});
function sanitizeText(input, maxLength = 2e3) {
  if (!input || typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "").slice(0, maxLength);
}
var pinRateLimitMap = /* @__PURE__ */ new Map();
function checkPinRateLimit(key) {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1e3;
  const LOCKOUT_MS = 15 * 60 * 1e3;
  const now = Date.now();
  const record = pinRateLimitMap.get(key);
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  if (record.lockedUntil && now < record.lockedUntil) {
    const waitMinutes = Math.max(1, Math.ceil((record.lockedUntil - now) / 6e4));
    return { allowed: false, waitMinutes };
  }
  if (now - record.firstAttemptAt > WINDOW_MS) {
    pinRateLimitMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    if (!record.lockedUntil) {
      record.lockedUntil = now + LOCKOUT_MS;
    }
    const waitMinutes = Math.max(1, Math.ceil((record.lockedUntil - now) / 6e4));
    return { allowed: false, waitMinutes };
  }
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}
function recordFailedPinAttempt(key) {
  const now = Date.now();
  const record = pinRateLimitMap.get(key);
  if (!record) {
    pinRateLimitMap.set(key, { attempts: 1, firstAttemptAt: now });
    return 4;
  }
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1e3;
    return 0;
  }
  return Math.max(0, 5 - record.attempts);
}
function resetPinAttempts(key) {
  pinRateLimitMap.delete(key);
}
var gameCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
function extractPlaceId(input) {
  const cleanInput = input.trim();
  if (/^\d+$/.test(cleanInput)) {
    return parseInt(cleanInput, 10);
  }
  const match = cleanInput.match(/roblox\.com\/games\/(\d+)/i) || cleanInput.match(/placeId=(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Bloxboxd API" });
});
function computeRatingStats(upVotes, downVotes) {
  const up = Math.max(0, upVotes || 0);
  const down = Math.max(0, downVotes || 0);
  const total = up + down;
  if (total === 0) {
    return {
      ratingAverage: 4.5,
      ratingCount: 0,
      ratingHistogram: {
        "0.5": 0,
        "1.0": 0,
        "1.5": 0,
        "2.0": 0,
        "2.5": 0,
        "3.0": 0,
        "3.5": 0,
        "4.0": 0,
        "4.5": 0,
        "5.0": 0
      }
    };
  }
  const ratingHistogram = {
    "0.5": Math.round(down * 0.2),
    "1.0": Math.round(down * 0.2),
    "1.5": Math.round(down * 0.15),
    "2.0": Math.round(down * 0.15),
    "2.5": Math.round(down * 0.15),
    "3.0": Math.round(down * 0.15),
    "3.5": Math.round(up * 0.05),
    "4.0": Math.round(up * 0.15),
    "4.5": Math.round(up * 0.25),
    "5.0": Math.round(up * 0.55)
  };
  let sum = 0;
  let count = 0;
  for (const [star, c] of Object.entries(ratingHistogram)) {
    sum += parseFloat(star) * c;
    count += c;
  }
  const ratingAverage = count > 0 ? Math.round(sum / count * 10) / 10 : 4.5;
  return {
    ratingAverage,
    ratingCount: total,
    ratingHistogram
  };
}
function extractRobloxGenreMetadata(rawGenre, genreL1, genreL2) {
  const l1 = (genreL1 || "").trim();
  const l2 = (genreL2 || "").trim();
  const legacy = (rawGenre || "").trim();
  let primaryGenre = l1;
  if (!primaryGenre && legacy && legacy.toLowerCase() !== "all") {
    primaryGenre = legacy;
  }
  if (!primaryGenre) {
    primaryGenre = "Variety";
  }
  let subgenre = l2 || void 0;
  if (!subgenre && legacy && legacy.toLowerCase() !== "all" && legacy.toLowerCase() !== primaryGenre.toLowerCase()) {
    subgenre = legacy;
  }
  const tags = ["roblox"];
  if (primaryGenre && primaryGenre !== "Variety") tags.push(primaryGenre.toLowerCase());
  if (subgenre) tags.push(subgenre.toLowerCase());
  if (legacy && legacy !== "All" && !tags.includes(legacy.toLowerCase())) tags.push(legacy.toLowerCase());
  return {
    genre: primaryGenre,
    subgenre,
    genre_l1: l1 || void 0,
    genre_l2: l2 || void 0,
    tags
  };
}
async function fetchUniverseDetails(universeId, placeId) {
  const [gamesRes, votesRes, iconRes, thumbRes] = await Promise.all([
    fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    }),
    fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    }),
    fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    }),
    fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    })
  ]);
  let gameInfo = null;
  if (gamesRes.ok) {
    const gamesData = await gamesRes.json();
    if (gamesData.data && gamesData.data.length > 0) {
      gameInfo = gamesData.data[0];
    }
  }
  let upVotes = 0;
  let downVotes = 0;
  if (votesRes.ok) {
    const votesData = await votesRes.json();
    if (votesData.data && votesData.data.length > 0) {
      upVotes = votesData.data[0].upVotes || 0;
      downVotes = votesData.data[0].downVotes || 0;
    }
  }
  let iconUrl = "";
  if (iconRes.ok) {
    const iconData = await iconRes.json();
    if (iconData.data && iconData.data.length > 0 && iconData.data[0].imageUrl) {
      iconUrl = iconData.data[0].imageUrl;
    }
  }
  let bannerUrl = "";
  if (thumbRes.ok) {
    const thumbData = await thumbRes.json();
    if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].thumbnails?.[0]?.imageUrl) {
      bannerUrl = thumbData.data[0].thumbnails[0].imageUrl;
    }
  }
  const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
  const rawVisits = gameInfo?.visits || 0;
  const favoritedCount = gameInfo?.favoritedCount || 0;
  const genreMeta = extractRobloxGenreMetadata(
    gameInfo?.genre,
    gameInfo?.genre_l1,
    gameInfo?.genre_l2
  );
  return {
    id: `roblox-${universeId}`,
    universeId,
    rootPlaceId: placeId || gameInfo?.rootPlaceId || 0,
    name: gameInfo?.name || `Roblox Experience #${placeId}`,
    description: gameInfo?.description || "No description provided by creator.",
    creatorName: gameInfo?.creator?.name || "Roblox Creator",
    creatorType: gameInfo?.creator?.type || "Group",
    iconUrl: iconUrl || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter",
    bannerUrl: bannerUrl || void 0,
    genre: genreMeta.genre,
    subgenre: genreMeta.subgenre,
    genre_l1: genreMeta.genre_l1,
    genre_l2: genreMeta.genre_l2,
    playerCount: gameInfo?.playing || 0,
    totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : "0",
    rawVisits,
    favoritedCount,
    upVotes,
    downVotes,
    releaseYear: gameInfo?.created ? new Date(gameInfo.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
    ratingAverage,
    ratingCount,
    ratingHistogram,
    tags: ["roblox", "live-game", ...genreMeta.tags]
  };
}
var cachedDbCatalog = [];
var lastDbCatalogFetchTime = 0;
var DB_CATALOG_CACHE_TTL = 5 * 60 * 1e3;
async function getCachedDbCatalog() {
  const now = Date.now();
  if (cachedDbCatalog.length > 0 && now - lastDbCatalogFetchTime < DB_CATALOG_CACHE_TTL) {
    return cachedDbCatalog;
  }
  try {
    cachedDbCatalog = await getAllGames(500);
    lastDbCatalogFetchTime = now;
  } catch (e) {
    console.error("Failed to refresh db catalog cache:", e);
  }
  return cachedDbCatalog;
}
var onlineSearchCache = /* @__PURE__ */ new Map();
var SEARCH_CACHE_TTL = 10 * 60 * 1e3;
var universeDetailsCache = /* @__PURE__ */ new Map();
var UNIVERSE_DETAILS_CACHE_TTL = 30 * 60 * 1e3;
async function fetchBatchUniverseDetails(universeIds) {
  const resultMap = /* @__PURE__ */ new Map();
  if (!universeIds || universeIds.length === 0) return resultMap;
  const missingIds = [];
  const now = Date.now();
  for (const uid of universeIds) {
    if (!uid) continue;
    const cached = universeDetailsCache.get(uid);
    if (cached && now - cached.timestamp < UNIVERSE_DETAILS_CACHE_TTL) {
      resultMap.set(uid, cached.data);
    } else {
      missingIds.push(uid);
    }
  }
  if (missingIds.length === 0) {
    return resultMap;
  }
  const uniqueMissing = Array.from(new Set(missingIds));
  const CHUNK_SIZE = 40;
  await Promise.all(
    Array.from({ length: Math.ceil(uniqueMissing.length / CHUNK_SIZE) }, async (_, idx) => {
      const chunk = uniqueMissing.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
      const endpoints = [
        `https://games.roproxy.com/v1/games?universeIds=${chunk.join(",")}`,
        `https://games.roblox.com/v1/games?universeIds=${chunk.join(",")}`
      ];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            headers: { "User-Agent": "Bloxboxd/1.0" }
          });
          if (res.ok) {
            const data = await res.json();
            for (const item of data.data || []) {
              if (item.id) {
                resultMap.set(item.id, item);
                universeDetailsCache.set(item.id, { data: item, timestamp: Date.now() });
              }
            }
            if (data.data && data.data.length > 0) break;
          }
        } catch (e) {
        }
      }
    })
  );
  return resultMap;
}
async function fetchBatchIcons(universeIds) {
  const iconMap = /* @__PURE__ */ new Map();
  if (!universeIds || universeIds.length === 0) return iconMap;
  const uniqueIds = Array.from(new Set(universeIds.filter(Boolean)));
  const CHUNK_SIZE = 50;
  await Promise.all(
    Array.from({ length: Math.ceil(uniqueIds.length / CHUNK_SIZE) }, async (_, idx) => {
      const chunk = uniqueIds.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
      const iconEndpoints = [
        `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${chunk.join(",")}&size=512x512&format=Png&isCircular=false`,
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunk.join(",")}&size=512x512&format=Png&isCircular=false`
      ];
      for (const ep of iconEndpoints) {
        try {
          const iconRes = await fetch(ep, { headers: { "User-Agent": "Bloxboxd/1.0" } });
          if (iconRes.ok) {
            const iconData = await iconRes.json();
            for (const ic of iconData.data || []) {
              if (ic.targetId && ic.imageUrl) {
                iconMap.set(ic.targetId, ic.imageUrl);
              }
            }
            if (iconMap.size > 0) break;
          }
        } catch (e) {
        }
      }
    })
  );
  return iconMap;
}
async function searchRobloxLiveOnline(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return [];
  const cacheKey = query.toLowerCase();
  const cached = onlineSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return cached.results;
  }
  const sessionId = crypto.randomUUID();
  const searchEndpoints = [
    `https://apis.roproxy.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`,
    `https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`
  ];
  const rawGames = [];
  for (const ep of searchEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": `https://www.roblox.com/discover/?Keyword=${encodeURIComponent(query)}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        for (const group of data.searchResults || []) {
          if (Array.isArray(group.contents)) {
            for (const item of group.contents) {
              if (item.universeId && item.name) {
                rawGames.push(item);
              }
            }
          }
        }
        if (rawGames.length > 0) break;
      } else if (res.status === 429) {
        console.warn(`[Roblox Search API] Rate limited (429) on ${ep}`);
      }
    } catch (err) {
      console.warn(`Search endpoint ${ep} failed:`, err);
    }
  }
  if (rawGames.length === 0) return [];
  const topGames = rawGames.slice(0, 40);
  const universeIds = topGames.map((g) => g.universeId);
  const [iconMap, universeDetailsMap] = await Promise.all([
    fetchBatchIcons(universeIds),
    fetchBatchUniverseDetails(universeIds)
  ]);
  const formattedResults = topGames.map((item) => {
    const details = universeDetailsMap.get(item.universeId);
    const upVotes = details?.favoritedCount || item.totalUpVotes || 0;
    const downVotes = item.totalDownVotes || 0;
    const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
    const iconUrl = iconMap.get(item.universeId) || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter";
    const rawVisits = details?.visits ?? ((item.playerCount || 0) * 18 || 1e4);
    const rawGenre = details?.genre || item.genre;
    const genreL1 = details?.genre_l1 || item.genreL1 || item.genre_l1;
    const genreL2 = details?.genre_l2 || item.genreL2 || item.genre_l2;
    const genreMeta = extractRobloxGenreMetadata(rawGenre, genreL1, genreL2);
    return {
      id: `roblox-${item.universeId}`,
      universeId: item.universeId,
      rootPlaceId: details?.rootPlaceId || item.rootPlaceId || 0,
      name: details?.name || item.name,
      description: details?.description || item.description || "",
      creatorName: details?.creator?.name || item.creatorName || "Roblox Creator",
      creatorType: details?.creator?.hasVerifiedBadge || item.creatorHasVerifiedBadge ? "Verified" : "Group",
      iconUrl,
      genre: genreMeta.genre,
      subgenre: genreMeta.subgenre,
      genre_l1: genreMeta.genre_l1,
      genre_l2: genreMeta.genre_l2,
      playerCount: details?.playing ?? (item.playerCount || 0),
      totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : "10,000+",
      rawVisits,
      favoritedCount: upVotes,
      upVotes,
      downVotes,
      releaseYear: details?.created ? new Date(details.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
      ratingAverage,
      ratingCount,
      ratingHistogram,
      tags: ["roblox", "live-search", ...genreMeta.tags].filter(Boolean)
    };
  });
  if (formattedResults.length > 0) {
    onlineSearchCache.set(cacheKey, { results: formattedResults, timestamp: Date.now() });
  }
  return formattedResults;
}
app.get("/api/roblox/resolve", async (req, res) => {
  try {
    const query = (req.query.query || req.query.placeId || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Query or placeId parameter is required" });
    }
    const placeId = extractPlaceId(query);
    if (!placeId) {
      try {
        const dbGames = await getCachedDbCatalog();
        const qLower = query.toLowerCase();
        const dbMatch = dbGames.find((g) => {
          const nameMatch = g.name.toLowerCase().includes(qLower);
          const creatorMatch = (g.creatorName || "").toLowerCase().includes(qLower);
          const tagMatch = Array.isArray(g.tags) && g.tags.some((t) => t.toLowerCase() === qLower);
          return nameMatch || creatorMatch || tagMatch;
        });
        if (dbMatch) {
          return res.json({ source: "database", ...dbMatch });
        }
      } catch (e) {
        console.warn("DB check in resolve error:", e);
      }
      const onlineResults = await searchRobloxLiveOnline(query);
      if (onlineResults.length > 0) {
        const bestMatch = onlineResults[0];
        upsertGame(bestMatch).catch((e) => console.warn("[Database] Failed to background upsert search result:", e));
        return res.json({ source: "roblox-online-search", ...bestMatch });
      }
      return res.status(404).json({ error: `Game "${query}" not found on Roblox. Coba masukkan Place ID atau link Roblox jika namanya spesifik.` });
    }
    const cacheKey = `place_${placeId}`;
    const cached = gameCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ source: "cache", ...cached.data });
    }
    const universeRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    });
    if (!universeRes.ok) {
      return res.status(universeRes.status).json({
        error: `Failed to resolve Place ID ${placeId} on Roblox.`,
        status: universeRes.status
      });
    }
    const universeData = await universeRes.json();
    const universeId = universeData.universeId;
    if (!universeId) {
      return res.status(404).json({ error: "Universe ID not found for this Place" });
    }
    const resolvedGame = await fetchUniverseDetails(universeId, placeId);
    gameCache.set(cacheKey, { data: resolvedGame, timestamp: Date.now() });
    upsertGame(resolvedGame).catch((e) => console.warn("[Database] Failed to background upsert resolved game:", e));
    return res.json({ source: "roblox_api", ...resolvedGame });
  } catch (error) {
    console.error("Error resolving Roblox experience:", error);
    return res.status(500).json({ error: "Internal server error while contacting Roblox services" });
  }
});
app.get("/api/roblox/batch", async (req, res) => {
  try {
    const universeIds = req.query.universeIds?.trim();
    if (!universeIds) {
      return res.status(400).json({ error: "universeIds parameter is required" });
    }
    const ids = universeIds.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.json({ data: [] });
    }
    const CHUNK_SIZE = 30;
    const chunks = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + CHUNK_SIZE));
    }
    const allResults = [];
    await Promise.all(
      chunks.map(async (chunkIds) => {
        try {
          const [gamesRes, votesRes, iconRes, thumbRes] = await Promise.all([
            fetch(`https://games.roblox.com/v1/games?universeIds=${chunkIds.join(",")}`, {
              headers: { "User-Agent": "Bloxboxd/1.0" }
            }),
            fetch(`https://games.roblox.com/v1/games/votes?universeIds=${chunkIds.join(",")}`, {
              headers: { "User-Agent": "Bloxboxd/1.0" }
            }),
            fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunkIds.join(",")}&size=512x512&format=Png&isCircular=false`, {
              headers: { "User-Agent": "Bloxboxd/1.0" }
            }),
            fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${chunkIds.join(",")}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`, {
              headers: { "User-Agent": "Bloxboxd/1.0" }
            })
          ]);
          const gamesData = gamesRes.ok ? await gamesRes.json() : { data: [] };
          const votesData = votesRes.ok ? await votesRes.json() : { data: [] };
          const iconData = iconRes.ok ? await iconRes.json() : { data: [] };
          const thumbData = thumbRes.ok ? await thumbRes.json() : { data: [] };
          for (const g of gamesData.data || []) {
            const icon = iconData.data?.find((i) => i.targetId === g.id)?.imageUrl || null;
            const banner = thumbData.data?.find((t) => t.universeId === g.id)?.thumbnails?.[0]?.imageUrl || null;
            const vote = votesData.data?.find((v) => v.id === g.id);
            const upVotes = vote?.upVotes || 0;
            const downVotes = vote?.downVotes || 0;
            const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
            const genreMeta = extractRobloxGenreMetadata(g.genre, g.genre_l1, g.genre_l2);
            allResults.push({
              universeId: g.id,
              rootPlaceId: g.rootPlaceId,
              name: g.name,
              description: g.description,
              creatorName: g.creator?.name,
              playerCount: g.playing || 0,
              totalVisits: g.visits ? Number(g.visits).toLocaleString() : "0",
              rawVisits: g.visits || 0,
              favoritedCount: g.favoritedCount || 0,
              upVotes,
              downVotes,
              genre: genreMeta.genre,
              subgenre: genreMeta.subgenre,
              genre_l1: genreMeta.genre_l1,
              genre_l2: genreMeta.genre_l2,
              tags: genreMeta.tags,
              ratingAverage,
              ratingCount,
              ratingHistogram,
              iconUrl: icon,
              bannerUrl: banner,
              updatedAt: Date.now()
            });
          }
        } catch (chunkErr) {
          console.error("Error fetching batch chunk:", chunkErr);
        }
      })
    );
    return res.json({ data: allResults, count: allResults.length, timestamp: Date.now() });
  } catch (err) {
    console.error("Error fetching batch roblox data:", err);
    return res.status(500).json({ error: "Failed to fetch batch data" });
  }
});
var cachedDiscoverGames = [];
var lastDiscoverFetchTime = 0;
var DISCOVER_CACHE_TTL = 10 * 60 * 1e3;
async function fetchLiveDiscoverGames() {
  if (cachedDiscoverGames.length > 50 && Date.now() - lastDiscoverFetchTime < DISCOVER_CACHE_TTL) {
    return cachedDiscoverGames;
  }
  const sessionId = crypto.randomUUID();
  const sorts = ["CCU_Based_V1", "Top_Trending_V6", "Up_And_Coming_V6", "Fun_With_Friends_V4", "Top_Revisited_Existing_Users_V4"];
  const gameMap = /* @__PURE__ */ new Map();
  for (const sortId of sorts) {
    try {
      const res = await fetch(`https://apis.roproxy.com/explore-api/v1/get-sort-content?sessionId=${sessionId}&sortId=${sortId}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.ok) {
        const data = await res.json();
        for (const g of data.games || []) {
          if (g.universeId && !gameMap.has(g.universeId)) {
            gameMap.set(g.universeId, g);
          }
        }
      }
    } catch (e) {
    }
  }
  const allGames = Array.from(gameMap.values());
  if (allGames.length > 0) {
    cachedDiscoverGames = allGames;
    lastDiscoverFetchTime = Date.now();
  }
  return cachedDiscoverGames;
}
var GENRE_KEYWORD_MAP = {
  "Action": "action fighting battleground",
  "RPG": "rpg action-rpg adventure",
  "Shooter": "shooter fps deathmatch",
  "Survival": "survival escape horror",
  "Roleplay & Avatar Sim": "roleplay life dress up avatar",
  "Simulation": "simulation tycoon simulator",
  "Strategy": "strategy tower defense",
  "Obby & Platformer": "obby platformer parkour",
  "Party & Casual": "party minigames casual",
  "Horror": "horror scary survival",
  "Action / Fighting": "action fighting battleground",
  "Adventure / RPG": "rpg adventure",
  "Social / Roleplay": "roleplay avatar life",
  "Shooter / FPS": "shooter fps",
  "Obby / Parkour": "obby parkour",
  "Simulator / Tycoon": "simulation tycoon",
  "Tower Defense": "tower defense strategy"
};
var omniSearchCache = /* @__PURE__ */ new Map();
var OMNI_SEARCH_CACHE_TTL = 10 * 60 * 1e3;
async function fetchRobloxOmniSearchPage(query, pageToken) {
  const cacheKey = `${query.toLowerCase().trim()}::${pageToken || ""}`;
  const cached = omniSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < OMNI_SEARCH_CACHE_TTL) {
    return cached.data;
  }
  const sessionId = crypto.randomUUID();
  let url = `https://apis.roproxy.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }
  const endpoints = [
    url,
    url.replace("apis.roproxy.com", "apis.roblox.com")
  ];
  let searchData = null;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*"
        }
      });
      if (res.ok) {
        searchData = await res.json();
        if (searchData?.searchResults) break;
      } else if (res.status === 429) {
        console.warn(`[Roblox Omni-Search] Rate limited (429) on ${ep}`);
      }
    } catch (e) {
    }
  }
  if (!searchData || !searchData.searchResults) {
    return { games: [] };
  }
  const rawGames = [];
  for (const group of searchData.searchResults) {
    if (Array.isArray(group.contents)) {
      for (const item of group.contents) {
        if (item.universeId && item.name) {
          rawGames.push(item);
        }
      }
    }
  }
  const result = {
    games: rawGames,
    nextPageToken: searchData.nextPageToken || void 0
  };
  if (rawGames.length > 0) {
    omniSearchCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }
  return result;
}
app.get("/api/roblox/discover", async (req, res) => {
  try {
    const genre = (req.query.genre || "All").trim();
    const pageToken = (req.query.pageToken || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "30", 10)));
    let rawGames = [];
    let nextPageToken = void 0;
    if (genre !== "All" && GENRE_KEYWORD_MAP[genre]) {
      const query = GENRE_KEYWORD_MAP[genre];
      const searchRes = await fetchRobloxOmniSearchPage(query, pageToken || void 0);
      rawGames = searchRes.games;
      nextPageToken = searchRes.nextPageToken;
    } else {
      if (pageToken) {
        const searchRes = await fetchRobloxOmniSearchPage("popular top multiplayer games", pageToken);
        rawGames = searchRes.games;
        nextPageToken = searchRes.nextPageToken;
      } else {
        const [exploreGames, omniRes] = await Promise.all([
          fetchLiveDiscoverGames(),
          fetchRobloxOmniSearchPage("popular top multiplayer games")
        ]);
        const combinedMap = /* @__PURE__ */ new Map();
        for (const g of exploreGames) {
          if (g.universeId) combinedMap.set(g.universeId, g);
        }
        for (const g of omniRes.games) {
          if (g.universeId && !combinedMap.has(g.universeId)) {
            combinedMap.set(g.universeId, g);
          }
        }
        rawGames = Array.from(combinedMap.values()).slice(0, limit);
        nextPageToken = omniRes.nextPageToken;
      }
    }
    if (rawGames.length === 0) {
      const fallbackGames = await fetchLiveDiscoverGames();
      const offset = (page - 1) * limit;
      rawGames = fallbackGames.slice(offset, offset + limit);
    }
    if (rawGames.length === 0) {
      try {
        const dbGames = await getCachedDbCatalog();
        const filtered = genre !== "All" ? dbGames.filter((g) => (g.genre || "").toLowerCase().includes(genre.toLowerCase()) || (g.tags || []).some((t) => t.toLowerCase().includes(genre.toLowerCase()))) : dbGames;
        if (filtered.length > 0) {
          const isCursorPagination = Boolean(pageToken);
          const offset = isCursorPagination ? 0 : (page - 1) * limit;
          const slice = filtered.slice(offset, offset + limit);
          return res.json({
            games: slice,
            page,
            total: filtered.length,
            hasMore: isCursorPagination ? false : offset + limit < filtered.length,
            nextPageToken: void 0,
            source: "database-resilience-fallback"
          });
        }
      } catch (dbErr) {
        console.warn("Database fallback error in discover:", dbErr);
      }
      return res.json({ games: [], page, total: 0, hasMore: false, nextPageToken: void 0 });
    }
    const universeIds = rawGames.map((g) => g.universeId);
    const [iconMap, universeDetailsMap] = await Promise.all([
      fetchBatchIcons(universeIds),
      fetchBatchUniverseDetails(universeIds)
    ]);
    const formattedGames = rawGames.map((item) => {
      const details = universeDetailsMap.get(item.universeId);
      const upVotes = details?.favoritedCount || item.totalUpVotes || 0;
      const downVotes = item.totalDownVotes || 0;
      const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
      const iconUrl = iconMap.get(item.universeId) || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter";
      const rawVisits = details?.visits ?? ((item.playerCount || 0) * 20 || 1e4);
      const rawGenre = details?.genre || item.genre;
      const genreL1 = details?.genre_l1 || item.genreL1 || item.genre_l1;
      const genreL2 = details?.genre_l2 || item.genreL2 || item.genre_l2;
      const genreMeta = extractRobloxGenreMetadata(rawGenre, genreL1, genreL2);
      if (genre && genre !== "All" && (genreMeta.genre === "Variety" || !genreMeta.genre)) {
        genreMeta.genre = genre;
        if (!genreMeta.subgenre) genreMeta.subgenre = genre;
        if (!genreMeta.tags.includes(genre.toLowerCase())) {
          genreMeta.tags.push(genre.toLowerCase());
        }
      }
      return {
        id: `roblox-${item.universeId}`,
        universeId: item.universeId,
        rootPlaceId: details?.rootPlaceId || item.rootPlaceId || 0,
        name: details?.name || item.name,
        description: details?.description || item.description || `Popular Roblox experience with over ${(details?.playing || item.playerCount || 0).toLocaleString()} active players.`,
        creatorName: details?.creator?.name || item.creatorName || "Roblox Creator",
        creatorType: details?.creator?.hasVerifiedBadge || item.creatorHasVerifiedBadge ? "Verified" : "Group",
        iconUrl,
        genre: genreMeta.genre,
        subgenre: genreMeta.subgenre,
        genre_l1: genreMeta.genre_l1,
        genre_l2: genreMeta.genre_l2,
        playerCount: details?.playing ?? (item.playerCount || 0),
        totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : "10,000+",
        rawVisits,
        favoritedCount: upVotes,
        upVotes,
        downVotes,
        releaseYear: details?.created ? new Date(details.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
        ratingAverage,
        ratingCount,
        ratingHistogram,
        tags: ["roblox", "live-feed", ...genreMeta.tags]
      };
    });
    if (formattedGames.length > 0) {
      bulkUpsertGames(formattedGames).catch((e) => console.warn("[Database] Failed to background upsert discovered games:", e));
    }
    return res.json({
      games: formattedGames,
      page,
      total: formattedGames.length,
      hasMore: Boolean(nextPageToken) || formattedGames.length >= 10,
      nextPageToken
    });
  } catch (err) {
    console.error("Error in /api/roblox/discover:", err);
    return res.status(500).json({ error: "Failed to discover Roblox games" });
  }
});
app.get("/api/roblox/search", async (req, res) => {
  try {
    const rawQuery = (req.query.q || req.query.query || "").trim();
    if (!rawQuery) {
      return res.json({ results: [], total: 0 });
    }
    const placeId = extractPlaceId(rawQuery);
    let catalog = [];
    try {
      catalog = await getCachedDbCatalog();
    } catch (e) {
      console.error("Failed to fetch catalog from database cache:", e);
    }
    if (placeId) {
      const existing = catalog.find((g) => g.rootPlaceId === placeId || g.universeId === placeId);
      if (existing) {
        return res.json({ results: [existing], total: 1 });
      }
      try {
        const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
          headers: { "User-Agent": "Bloxboxd/1.0" }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.universeId) {
            const liveGame = await fetchUniverseDetails(uData.universeId, placeId);
            upsertGame(liveGame).catch((e) => console.warn("[Database] Failed to upsert resolved liveGame:", e));
            return res.json({ results: [liveGame], total: 1 });
          }
        }
      } catch (err) {
      }
    }
    const qLower = rawQuery.toLowerCase();
    const queryTokens = qLower.split(/\s+/).filter(Boolean);
    const matches = [];
    const seenUniverses = /* @__PURE__ */ new Set();
    try {
      const liveResults = await searchRobloxLiveOnline(rawQuery);
      if (liveResults.length > 0) {
        bulkUpsertGames(liveResults).catch((e) => console.warn("[Database] Failed to upsert search liveResults:", e));
      }
      for (const lr of liveResults) {
        if (!seenUniverses.has(lr.universeId)) {
          seenUniverses.add(lr.universeId);
          matches.push(lr);
        }
      }
    } catch (e) {
      console.error("Error fetching live online results during search:", e);
    }
    for (const g of catalog) {
      if (seenUniverses.has(g.universeId)) continue;
      const gName = g.name.toLowerCase();
      const gCreator = (g.creatorName || "").toLowerCase();
      const gGenre = (g.genre || "").toLowerCase();
      const gTags = Array.isArray(g.tags) ? g.tags.join(" ").toLowerCase() : "";
      const gPlace = (g.rootPlaceId || "").toString();
      if (gName.includes(qLower) || gCreator.includes(qLower) || gGenre.includes(qLower) || gTags.includes(qLower) || gPlace.includes(rawQuery)) {
        seenUniverses.add(g.universeId);
        matches.push(g);
      } else if (queryTokens.every((tok) => gName.includes(tok) || gCreator.includes(tok) || gGenre.includes(tok) || gTags.includes(tok))) {
        seenUniverses.add(g.universeId);
        matches.push(g);
      }
    }
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aExact = aName === qLower ? 4 : aName.startsWith(qLower) ? 3 : aName.includes(qLower) ? 2 : 1;
      const bExact = bName === qLower ? 4 : bName.startsWith(qLower) ? 3 : bName.includes(qLower) ? 2 : 1;
      if (aExact !== bExact) return bExact - aExact;
      return (b.playerCount || 0) - (a.playerCount || 0);
    });
    return res.json({ results: matches.slice(0, 40), total: matches.length });
  } catch (error) {
    console.error("Error in /api/roblox/search:", error);
    return res.status(500).json({ error: "Search failed" });
  }
});
app.get("/api/roblox/user/lookup", async (req, res) => {
  try {
    const rawQuery = (req.query.q || req.query.username || "").trim();
    if (!rawQuery) {
      return res.status(400).json({ error: "Username, User ID, or profile URL is required" });
    }
    let userId = null;
    let fallbackUsername = rawQuery;
    const urlMatch = rawQuery.match(/roblox\.com\/users\/(\d+)/i);
    if (urlMatch && urlMatch[1]) {
      userId = parseInt(urlMatch[1], 10);
    } else if (/^\d+$/.test(rawQuery)) {
      userId = parseInt(rawQuery, 10);
    } else {
      const lookupRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "Bloxboxd/1.0" },
        body: JSON.stringify({ usernames: [rawQuery], excludeBannedUsers: false })
      });
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        if (lookupData.data && lookupData.data.length > 0) {
          userId = lookupData.data[0].id;
          fallbackUsername = lookupData.data[0].name;
        }
      }
    }
    if (!userId) {
      return res.status(404).json({ error: `Akun Roblox "${rawQuery}" tidak ditemukan. Pastikan username atau ID sudah benar.` });
    }
    const [userRes, headshotRes, bustRes, friendsRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      }),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=Png&isCircular=false`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }),
      fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      })
    ]);
    const uData = userRes.ok ? await userRes.json() : {};
    const hData = headshotRes.ok ? await headshotRes.json() : {};
    const bData = bustRes.ok ? await bustRes.json() : {};
    const fData = friendsRes.ok ? await friendsRes.json() : {};
    const username = uData.name || fallbackUsername;
    const displayName = uData.displayName || username;
    const hasVerifiedBadge = !!uData.hasVerifiedBadge;
    const description = uData.description || "";
    const created = uData.created || "";
    const friendsCount = fData.count || 0;
    const headshotUrl = hData.data?.[0]?.imageUrl || "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/420/420/AvatarHeadshot/Png/noFilter";
    const bustUrl = bData.data?.[0]?.imageUrl || headshotUrl;
    return res.json({
      success: true,
      user: {
        userId,
        username,
        displayName,
        hasVerifiedBadge,
        description,
        created,
        joinedYear: created ? new Date(created).getFullYear() : void 0,
        friendsCount,
        avatarHeadshotUrl: headshotUrl,
        avatarBustUrl: bustUrl
      }
    });
  } catch (err) {
    console.error("Error looking up Roblox user:", err);
    return res.status(500).json({ error: "Gagal mengambil data akun Roblox." });
  }
});
function hashPin(pin, salt) {
  return crypto.pbkdf2Sync(pin, salt, 1e3, 32, "sha256").toString("hex");
}
var ROBLOX_FILTER_SAFE_WORDS = [
  "silver",
  "golden",
  "dragon",
  "falcon",
  "rabbit",
  "apple",
  "banana",
  "orange",
  "star",
  "moon",
  "river",
  "cloud",
  "castle",
  "island",
  "crystal",
  "guitar",
  "sunny",
  "brave",
  "swift",
  "green",
  "blue",
  "winter",
  "summer",
  "panda",
  "diamond",
  "ocean",
  "forest",
  "knight",
  "spark",
  "breeze",
  "planet",
  "beacon",
  "timber",
  "feather",
  "glacier",
  "whisper",
  "shadow",
  "meadow",
  "harbor",
  "amber",
  "copper",
  "valley",
  "canyon",
  "stream",
  "pebble",
  "marble",
  "galaxy",
  "meteor",
  "compass",
  "anchor",
  "canvas",
  "velvet",
  "lantern",
  "candle",
  "shield",
  "banner",
  "tower",
  "bridge",
  "garden",
  "blossom",
  "clover",
  "tulip",
  "spruce",
  "willow",
  "cedar",
  "branch",
  "autumn",
  "spring",
  "sunrise",
  "sunset",
  "horizon",
  "zenith",
  "echo",
  "riddle",
  "fable",
  "legend",
  "voyage",
  "journey",
  "passage",
  "harbor",
  "summit",
  "peak",
  "crag",
  "cliff",
  "aurora",
  "comet",
  "stellar",
  "lunar",
  "solar",
  "marine",
  "coral",
  "lagoon",
  "tide",
  "wave",
  "drift",
  "current",
  "frost",
  "ember",
  "blaze",
  "torch",
  "hearth",
  "quiver",
  "arrow",
  "saber",
  "armor",
  "helm",
  "crown",
  "scepter",
  "throne",
  "palace",
  "spire",
  "portal",
  "haven",
  "sanctuary",
  "oasis",
  "temple",
  "shrine",
  "cairn",
  "grove",
  "thicket",
  "orchard",
  "prairie",
  "tundra",
  "steppe",
  "savanna",
  "dune",
  "delta",
  "badger",
  "otter",
  "beaver",
  "walrus",
  "dolphin",
  "whale",
  "eagle",
  "hawk",
  "heron",
  "crane",
  "sparrow",
  "finch",
  "robin",
  "raven",
  "parrot",
  "canary"
];
var activeChallenges = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, c] of activeChallenges.entries()) {
    if (now > c.expiresAt) {
      activeChallenges.delete(id);
    }
  }
}, 6e4);
app.get("/api/roblox/account/status", async (req, res) => {
  const userIdStr = req.query.userId?.toString();
  if (!userIdStr) {
    return res.status(400).json({ error: "userId is required" });
  }
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }
  try {
    const account = await getAccountByUserId(userId);
    if (account) {
      return res.json({
        registered: true,
        hasPin: Boolean(account.pinHash),
        username: account.username,
        verifiedAt: account.verifiedAt
      });
    }
    return res.json({
      registered: false,
      hasPin: false
    });
  } catch (err) {
    console.error("Error fetching account status:", err);
    return res.status(500).json({ error: "Gagal memeriksa status akun" });
  }
});
app.post("/api/roblox/account/challenge/start", async (req, res) => {
  try {
    const { userId, type = "bio" } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (!userRes.ok) {
      return res.status(404).json({ error: "Akun Roblox tidak ditemukan di server resmi Roblox." });
    }
    const userData = await userRes.json();
    const currentBio = (userData.description || "").toLowerCase();
    const challengeId = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + 4 * 60 * 1e3;
    if (type === "avatar") {
      const officialFreeItems = [
        {
          id: 417457461,
          name: "ROBLOX 'R' Baseball Cap",
          catalogUrl: "https://www.roblox.com/catalog/417457461/ROBLOX-R-Baseball-Cap"
        },
        {
          id: 607702162,
          name: "Roblox Baseball Cap",
          catalogUrl: "https://www.roblox.com/catalog/607702162/Roblox-Baseball-Cap"
        }
      ];
      let assetIds = [];
      try {
        const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar?_t=${Date.now()}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        if (avatarRes.ok) {
          const aData = await avatarRes.json();
          if (Array.isArray(aData.assets)) {
            assetIds = aData.assets.map((a) => Number(a.id)).filter((id) => !isNaN(id));
          }
        }
      } catch (e) {
        console.warn("Failed to fetch avatar endpoint, falling back to wearing endpoint", e);
      }
      if (assetIds.length === 0) {
        try {
          const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
          });
          if (wearingRes.ok) {
            const wData = await wearingRes.json();
            if (Array.isArray(wData.assetIds)) {
              assetIds = wData.assetIds.map((id) => Number(id)).filter((id) => !isNaN(id));
            }
          }
        } catch (e) {
          console.warn("Failed to fetch currently-wearing endpoint", e);
        }
      }
      const preferredId = Number(req.body.preferredItemId);
      const selectedItem = officialFreeItems.find((i) => i.id === preferredId) || officialFreeItems[0];
      const targetAssetId = selectedItem.id;
      const targetAssetName = selectedItem.name;
      const isCurrentlyWearing = assetIds.includes(targetAssetId);
      const expectedWearing = !isCurrentlyWearing;
      const challenge2 = {
        id: challengeId,
        userId: Number(userId),
        username: userData.name,
        type: "avatar",
        assetId: targetAssetId,
        assetName: targetAssetName,
        expectedWearing,
        createdAt: Date.now(),
        expiresAt
      };
      activeChallenges.set(challengeId, challenge2);
      return res.json({
        success: true,
        challengeId,
        type: "avatar",
        assetId: targetAssetId,
        assetName: targetAssetName,
        catalogUrl: selectedItem.catalogUrl,
        avatarEditorUrl: "https://www.roblox.com/my/avatar",
        availableItems: officialFreeItems,
        action: expectedWearing ? "equip" : "unequip",
        actionInstruction: expectedWearing ? `Buka Avatar Editor di roblox.com/my/avatar. Pakai topi resmi gratis "${targetAssetName}" (0 Robux di Catalog), lalu klik tombol verifikasi di bawah.` : `Buka Avatar Editor di roblox.com/my/avatar. Lepaskan sementara topi "${targetAssetName}", lalu klik tombol verifikasi di bawah.`,
        expiresInSeconds: 240
      });
    }
    const shuffled = [...ROBLOX_FILTER_SAFE_WORDS].sort(() => 0.5 - Math.random());
    const selectedWords = [];
    for (const word of shuffled) {
      if (!currentBio.includes(word.toLowerCase())) {
        selectedWords.push(word);
        if (selectedWords.length === 4) break;
      }
    }
    const phrase = selectedWords.join(" ");
    const challenge = {
      id: challengeId,
      userId: Number(userId),
      username: userData.name,
      type: "bio",
      words: selectedWords,
      phrase,
      initialBio: currentBio,
      createdAt: Date.now(),
      expiresAt
    };
    activeChallenges.set(challengeId, challenge);
    return res.json({
      success: true,
      challengeId,
      type: "bio",
      phrase,
      words: selectedWords,
      expiresInSeconds: 240
    });
  } catch (err) {
    console.error("Start challenge error:", err);
    return res.status(500).json({ error: "Gagal membuat sesi verifikasi aman." });
  }
});
app.post("/api/roblox/account/challenge/verify", async (req, res) => {
  try {
    const { challengeId, userId, pin, username } = req.body;
    if (!challengeId || !userId) {
      return res.status(400).json({ error: "challengeId dan userId diperlukan." });
    }
    if (!pin || pin.toString().trim().length < 4) {
      return res.status(400).json({ error: "PIN Keamanan minimal 4 angka untuk melindungi akun kamu." });
    }
    const challenge = activeChallenges.get(challengeId);
    if (!challenge || challenge.userId !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: "Sesi verifikasi tidak valid atau telah kedaluwarsa. Silakan mulai sesi verifikasi baru."
      });
    }
    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(challengeId);
      return res.status(403).json({
        success: false,
        error: "Waktu sesi verifikasi (4 menit) telah habis. Silakan klik buat sesi baru."
      });
    }
    if (challenge.type === "avatar") {
      let currentAssetIds = [];
      try {
        const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar?_t=${Date.now()}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        if (avatarRes.ok) {
          const aData = await avatarRes.json();
          if (Array.isArray(aData.assets)) {
            currentAssetIds = aData.assets.map((a) => Number(a.id)).filter((id) => !isNaN(id));
          }
        }
      } catch (e) {
        console.warn("Avatar verify fetch error:", e);
      }
      if (currentAssetIds.length === 0) {
        try {
          const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
          });
          if (wearingRes.ok) {
            const wData = await wearingRes.json();
            if (Array.isArray(wData.assetIds)) {
              currentAssetIds = wData.assetIds.map((id) => Number(id)).filter((id) => !isNaN(id));
            }
          }
        } catch (e) {
          console.warn("Currently-wearing verify fetch error:", e);
        }
      }
      const isNowWearing = currentAssetIds.includes(challenge.assetId);
      if (isNowWearing !== challenge.expectedWearing) {
        const actionMsg = challenge.expectedWearing ? `Topi "${challenge.assetName}" (ID: ${challenge.assetId}) belum terpasang di avatar kamu. Silakan pakai di Avatar Editor roblox.com/my/avatar, simpan perubahan, lalu klik tombol verifikasi lagi.` : `Topi "${challenge.assetName}" (ID: ${challenge.assetId}) masih terpasang di avatar kamu. Silakan lepas di Avatar Editor roblox.com/my/avatar, simpan perubahan, lalu klik tombol verifikasi lagi.`;
        return res.status(400).json({
          success: false,
          verified: false,
          message: actionMsg,
          error: actionMsg
        });
      }
    } else {
      const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!userRes.ok) {
        return res.status(500).json({ error: "Gagal menghubungi server Roblox untuk memeriksa profil." });
      }
      const uData = await userRes.json();
      const liveBio = (uData.description || "").toLowerCase();
      const allWordsPresent = challenge.words.every((w) => liveBio.includes(w.toLowerCase()));
      if (!allWordsPresent) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: `Frasa unik "${challenge.phrase}" belum ditemukan di kolom About / Bio akun Roblox kamu. Pastikan sudah disimpan di profil Roblox.`
        });
      }
    }
    activeChallenges.delete(challengeId);
    const salt = crypto.randomBytes(16).toString("hex");
    const pinHash = hashPin(pin.toString().trim(), salt);
    const sessionToken = crypto.randomBytes(24).toString("hex");
    const finalUsername = username || challenge.username || "RobloxPlayer";
    await saveAccount({
      userId: Number(userId),
      username: finalUsername,
      pinHash,
      salt,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const existingProfile = await getUserProfile(`user-roblox-${userId}`);
    if (!existingProfile) {
      await upsertUserProfile({
        id: `user-roblox-${userId}`,
        robloxUserId: Number(userId),
        username: finalUsername,
        handle: `@${finalUsername}`,
        joinedDate: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return res.json({
      success: true,
      verified: true,
      sessionToken,
      message: "Akun Roblox berhasil diverifikasi dan dilindungi dengan PIN Keamanan! Orang lain tidak akan bisa masuk tanpa PIN kamu."
    });
  } catch (err) {
    console.error("Challenge verify error:", err);
    return res.status(500).json({ error: "Terjadi kesalahan sistem saat memverifikasi akun." });
  }
});
app.post("/api/roblox/account/login-with-pin", async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: "userId and pin are required" });
    }
    const rateLimitKey = `pin_${userId}_${req.ip || "ip"}`;
    const rateStatus = checkPinRateLimit(rateLimitKey);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        success: false,
        error: `Terlalu banyak percobaan PIN salah. Akun dikunci sementara selama ${rateStatus.waitMinutes} menit demi keamanan.`,
        locked: true,
        waitMinutes: rateStatus.waitMinutes
      });
    }
    const account = await getAccountByUserId(Number(userId));
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Akun Roblox ini belum didaftarkan di Bloxboxd. Harap lakukan verifikasi kepemilikan terlebih dahulu."
      });
    }
    const testHash = hashPin(pin.toString().trim(), account.salt);
    if (testHash !== account.pinHash) {
      const remaining = recordFailedPinAttempt(rateLimitKey);
      if (remaining === 0) {
        return res.status(429).json({
          success: false,
          error: "PIN salah! Akun telah dikunci selama 15 menit karena mencapai 5 kali kegagalan berturut-turut demi melindungi akun Roblox kamu.",
          locked: true,
          remainingAttempts: 0
        });
      }
      return res.status(401).json({
        success: false,
        message: `PIN Keamanan salah! Sisa percobaan: ${remaining} kali sebelum akun dikunci 15 menit.`,
        remainingAttempts: remaining
      });
    }
    resetPinAttempts(rateLimitKey);
    const sessionToken = crypto.randomBytes(24).toString("hex");
    return res.json({
      success: true,
      sessionToken,
      username: account.username,
      message: "Login berhasil!"
    });
  } catch (err) {
    console.error("PIN Login error:", err);
    return res.status(500).json({ error: "Gagal memproses login PIN" });
  }
});
app.post("/api/roblox/account/reset-pin", async (req, res) => {
  try {
    const { challengeId, userId, newPin } = req.body;
    if (!challengeId || !userId || !newPin) {
      return res.status(400).json({ error: "challengeId, userId, dan newPin diperlukan." });
    }
    if (newPin.toString().trim().length < 4) {
      return res.status(400).json({ error: "PIN baru minimal 4 angka." });
    }
    const challenge = activeChallenges.get(challengeId);
    if (!challenge || challenge.userId !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: "Sesi verifikasi reset PIN tidak valid atau telah kedaluwarsa."
      });
    }
    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(challengeId);
      return res.status(403).json({
        success: false,
        error: "Sesi verifikasi reset PIN telah kedaluwarsa. Silakan mulai sesi baru."
      });
    }
    if (challenge.type === "avatar") {
      const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!wearingRes.ok) {
        return res.status(500).json({ error: "Gagal memeriksa avatar Roblox kamu." });
      }
      const wData = await wearingRes.json();
      const currentAssetIds = Array.isArray(wData.assetIds) ? wData.assetIds : [];
      const isNowWearing = currentAssetIds.includes(challenge.assetId);
      if (isNowWearing !== challenge.expectedWearing) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: "Perubahan avatar belum terdeteksi di server Roblox."
        });
      }
    } else {
      const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!userRes.ok) {
        return res.status(500).json({ error: "Gagal memeriksa profil Roblox." });
      }
      const uData = await userRes.json();
      const liveBio = (uData.description || "").toLowerCase();
      const allWordsPresent = challenge.words.every((w) => liveBio.includes(w.toLowerCase()));
      if (!allWordsPresent) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: `Frasa "${challenge.phrase}" belum ditemukan di bio profil Roblox kamu.`
        });
      }
    }
    activeChallenges.delete(challengeId);
    const salt = crypto.randomBytes(16).toString("hex");
    const pinHash = hashPin(newPin.toString().trim(), salt);
    const sessionToken = crypto.randomBytes(24).toString("hex");
    await saveAccount({
      userId: Number(userId),
      username: challenge.username || "RobloxPlayer",
      pinHash,
      salt,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return res.json({
      success: true,
      sessionToken,
      message: "PIN Keamanan berhasil diatur ulang dan akun berhasil diverifikasi!"
    });
  } catch (err) {
    console.error("Reset PIN error:", err);
    return res.status(500).json({ error: "Gagal mengatur ulang PIN" });
  }
});
app.get("/api/roblox/avatar", async (req, res) => {
  try {
    const username = req.query.username?.trim();
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const userLookupRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });
    if (userLookupRes.ok) {
      const lookupData = await userLookupRes.json();
      if (lookupData.data && lookupData.data.length > 0) {
        const userId = lookupData.data[0].id;
        const displayName = lookupData.data[0].displayName;
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
        );
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          if (thumbData.data && thumbData.data[0]?.imageUrl) {
            return res.json({
              userId,
              displayName,
              avatarUrl: thumbData.data[0].imageUrl
            });
          }
        }
        return res.json({ userId, displayName, avatarUrl: null });
      }
    }
    return res.json({ avatarUrl: null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to lookup avatar" });
  }
});
app.get("/api/games", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(1e3, parseInt(req.query.limit || "500", 10)));
    const games = await getAllGames(limit);
    return res.json({ games, count: games.length });
  } catch (err) {
    console.error("Error fetching games from database:", err);
    return res.status(500).json({ error: "Failed to fetch games" });
  }
});
app.get("/api/games/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const game = await getGameById(id);
    if (!game) {
      return res.status(404).json({ error: "Game not found in database" });
    }
    return res.json({ game });
  } catch (err) {
    console.error("Error fetching game by id:", err);
    return res.status(500).json({ error: "Failed to fetch game" });
  }
});
app.post("/api/games", async (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      await bulkUpsertGames(body);
      return res.json({ success: true, count: body.length });
    } else if (body && (body.id || body.universeId)) {
      await upsertGame(body);
      return res.json({ success: true, game: body });
    }
    return res.status(400).json({ error: "Valid game object or array of games is required" });
  } catch (err) {
    console.error("Error upserting game:", err);
    return res.status(500).json({ error: "Failed to save game to database" });
  }
});
app.get("/api/user/data", async (req, res) => {
  try {
    const userId = req.query.userId?.trim();
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const profile = await getUserProfile(userId);
    const logs = await getUserGameLogs(userId);
    const reviews = await getUserReviews(userId);
    return res.json({ profile, logs, reviews });
  } catch (err) {
    console.error("Error fetching user data:", err);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});
app.get("/api/users/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.json({ users: [] });
    }
    const users = await searchUserProfiles(q, 8);
    return res.json({ users });
  } catch (err) {
    console.error("Error searching users:", err);
    return res.status(500).json({ error: "Failed to search users" });
  }
});
app.post("/api/user/profile", async (req, res) => {
  try {
    const profile = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ error: "Valid profile object is required" });
    }
    profile.bio = sanitizeText(profile.bio, 500);
    profile.displayName = sanitizeText(profile.displayName, 80);
    profile.username = sanitizeText(profile.username, 50);
    await upsertUserProfile(profile);
    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("Error saving user profile:", err);
    return res.status(500).json({ error: "Failed to update user profile" });
  }
});
app.post("/api/logs", async (req, res) => {
  try {
    const log = req.body;
    if (!log || !log.userId || !log.gameId) {
      return res.status(400).json({ error: "userId and gameId are required" });
    }
    log.reviewText = sanitizeText(log.reviewText, 2500);
    await upsertGameLog(log);
    return res.json({ success: true, message: "Log saved" });
  } catch (err) {
    console.error("Error saving log:", err);
    return res.status(500).json({ error: "Failed to save log" });
  }
});
app.delete("/api/logs/:id", async (req, res) => {
  try {
    const logId = req.params.id;
    const userId = req.query.userId?.trim();
    if (!logId || !userId) {
      return res.status(400).json({ error: "logId and userId query are required" });
    }
    await deleteGameLog(userId, logId);
    return res.json({ success: true, message: "Log deleted" });
  } catch (err) {
    console.error("Error deleting log:", err);
    return res.status(500).json({ error: "Failed to delete log" });
  }
});
app.get("/api/reviews", async (req, res) => {
  try {
    const gameId = req.query.gameId?.trim();
    const reviews = await getAllReviews(gameId);
    return res.json({ reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
app.post("/api/reviews", async (req, res) => {
  try {
    const review = req.body;
    if (!review || !review.userId || !review.gameId || !review.reviewText?.trim()) {
      return res.status(400).json({ error: "Invalid review payload" });
    }
    review.reviewText = sanitizeText(review.reviewText, 3e3);
    review.username = sanitizeText(review.username, 50);
    await upsertReview(review);
    return res.json({ success: true, message: "Review saved" });
  } catch (err) {
    console.error("Error saving review:", err);
    return res.status(500).json({ error: "Failed to save review" });
  }
});
app.post("/api/reviews/:id/like", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId } = req.body;
    if (!reviewId || !userId) {
      return res.status(400).json({ error: "reviewId and userId are required" });
    }
    const result = await toggleReviewLike(userId, reviewId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Error liking review:", err);
    return res.status(500).json({ error: "Failed to like review" });
  }
});
app.get("/api/lists", async (req, res) => {
  try {
    const lists = await getAllCustomLists();
    return res.json({ lists });
  } catch (err) {
    console.error("Error fetching lists:", err);
    return res.status(500).json({ error: "Failed to fetch lists" });
  }
});
app.post("/api/lists", async (req, res) => {
  try {
    const list = req.body;
    if (!list || !list.userId || !list.title?.trim()) {
      return res.status(400).json({ error: "userId and title are required" });
    }
    list.title = sanitizeText(list.title, 120);
    list.description = sanitizeText(list.description, 1e3);
    list.userName = sanitizeText(list.userName, 50);
    await upsertCustomList(list);
    return res.json({ success: true, message: "List saved" });
  } catch (err) {
    console.error("Error saving list:", err);
    return res.status(500).json({ error: "Failed to save list" });
  }
});
app.delete("/api/lists/:id", async (req, res) => {
  try {
    const listId = req.params.id;
    const userId = req.query.userId?.trim();
    if (!listId || !userId) {
      return res.status(400).json({ error: "listId and userId query are required" });
    }
    await deleteCustomList(userId, listId);
    return res.json({ success: true, message: "List deleted" });
  } catch (err) {
    console.error("Error deleting list:", err);
    return res.status(500).json({ error: "Failed to delete list" });
  }
});
app.post("/api/lists/:id/like", async (req, res) => {
  try {
    const listId = req.params.id;
    const { userId } = req.body;
    if (!listId || !userId) {
      return res.status(400).json({ error: "listId and userId are required" });
    }
    const result = await toggleListLike(userId, listId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Error liking list:", err);
    return res.status(500).json({ error: "Failed to like list" });
  }
});
app.post("/api/users/:id/follow", async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { followerId } = req.body;
    if (!targetUserId || !followerId) {
      return res.status(400).json({ error: "targetUserId and followerId are required" });
    }
    if (targetUserId === followerId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }
    const result = await toggleFollowUser(followerId, targetUserId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Error toggling follow:", err);
    return res.status(500).json({ error: "Failed to toggle follow" });
  }
});
app.get("/api/users/:id/follow-status", async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.query.currentUserId?.trim() || "";
    if (!targetUserId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const status = await getFollowStatus(currentUserId, targetUserId);
    return res.json(status);
  } catch (err) {
    console.error("Error fetching follow status:", err);
    return res.status(500).json({ error: "Failed to fetch follow status" });
  }
});
app.get("/api/community/feed", async (req, res) => {
  try {
    const userId = req.query.userId?.trim();
    const feed = await getCommunityFeed(userId);
    return res.json({ feed });
  } catch (err) {
    console.error("Error fetching community feed:", err);
    return res.status(500).json({ error: "Failed to fetch community feed" });
  }
});
app.get("/api/community/trending", async (req, res) => {
  try {
    const data = await getTrendingReviewsAndLeaderboard();
    return res.json(data);
  } catch (err) {
    console.error("Error fetching trending and leaderboard:", err);
    return res.status(500).json({ error: "Failed to fetch trending and leaderboard" });
  }
});
app.get("/api/reviews/:id/comments", async (req, res) => {
  try {
    const reviewId = req.params.id;
    if (!reviewId) {
      return res.status(400).json({ error: "reviewId is required" });
    }
    const comments = await getReviewComments(reviewId);
    return res.json({ comments });
  } catch (err) {
    console.error("Error fetching review comments:", err);
    return res.status(500).json({ error: "Failed to fetch review comments" });
  }
});
app.post("/api/reviews/:id/comments", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId, username, userAvatar, commentText } = req.body;
    if (!reviewId || !userId || !commentText?.trim()) {
      return res.status(400).json({ error: "reviewId, userId, and non-empty commentText are required" });
    }
    const cleanComment = sanitizeText(commentText, 600);
    const cleanUsername = sanitizeText(username, 50) || "RobloxPlayer";
    const comment = await addReviewComment({
      reviewId,
      userId,
      username: cleanUsername,
      userAvatar,
      commentText: cleanComment
    });
    return res.json({ success: true, comment });
  } catch (err) {
    console.error("Error adding review comment:", err);
    return res.status(500).json({ error: "Failed to add review comment" });
  }
});
async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use("/assets", express.static(path2.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true
    }));
    app.use(express.static(distPath, {
      maxAge: "1h"
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bloxboxd server listening on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default
};
