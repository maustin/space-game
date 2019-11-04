# Space Game!
(working title)

## Description
Two ships face off in an epic 1v1 space battle!
The base game will allow the player to battle against a computer opponent.
A **stretch goal** will be to allow PVP combat between two human players over the internet.

## How It Works
First, each player will select 3 modules (out of a possible 10) to load onto their ships. Once modules are selected, battle will begin.

**The Nitty-Gritty**
> Each ship has shields (100 points), armor (100 points), and structure points (10 points). When a ship's structure points reach 0, the ship is destroyed.
> When an attack hits a ship, damage is first applied to the shields, then to the armor, then to the structure. Some weapons are stronger vs shields or armor, while others are weaker. (*future expansion*) Some weapons may target shields, armor, or structure directly, bypassing other defensive measures.

A round of combat consists of two phases. First, each player will select an action for that round. Next, these actions are resolved by dealing damage.
While the visual display shows one player attacking, then the other, the damage is calculated simultaneously.
If both ships survive, the process repeats in the next round.
If one or both ships are destroyed, the game is over.

There are two type of modules:
- Armaments provide a method to attack the enemy ship
- Mods provide either a defensive benefit or increase the effectiveness of an Armament

Armaments | Base Damage | Strong Vs | Weak Vs
---------- | ----- | -------- | --------
Laser | 20 | Shields | Armor
Gauss Cannon | 20 | Armor | Shields
Drones | 10 | | Drone Uplink Scrambler
Torpedoes | 10 | | Point Defense System

Modifications | Effect
---------- | ----------
Laser Amplifier | Increases laser damage by 50%
Gauss Charger | Increases gauss cannon damage by 50%
Point Defense System | 50% chance to destroy incoming torpedo
Drone Uplink Scrambler | Reduces drone damage by 50%
Shield Modulator | Increase shield power by 50%
Heavy Armor | Increase armor by 50%

_All values are subject to change during playtesting!_

## Stretch Goals
- Online PVP play
- More ship designs
- More weapon types
- Mode mods

## Potential Libraries
For the base game functionality, I'm looking at [CreateJS](https://createjs.com/). The benefits I think this library will bring are:
- Hierarchical display list (I'm a Flash veteran, I *need* this!)
- Eases working with bitmaps in canvas
- Animated bitmaps
- Robust tweening library

For my stretch goal of online PVP play, I'm considering (on advice from Tyler) [Socket.IO](https://socket.io/).

## Mockups
![Splash Screen]("/mockups/Splash Screen.png")

![Instructions](/mockups/Instructions.png)

![Pregame]("/mockups/Play - Pregame.png")

![Select Action]("/mockups/Play - Select Action.png")

![Round Resolution]("/mockups/Play - Turn Resolution.png")

![Game Over]("/mockups/Play - Game over.png")

