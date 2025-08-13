//custom spritekinds
namespace SpriteKind {
    export let MenuBackgroundSprite = SpriteKind.create()
    export let Projectile2 = SpriteKind.create()
    export let Effect = SpriteKind.create()
    export let Enemy2 = SpriteKind.create()
    export let EnemyBoss = SpriteKind.create()
    export let CarProjectile = SpriteKind.create()
    export let Target = SpriteKind.create()
}

//Status Bars
let enemy1CountBar: StatusBarSprite = null
let carHealthBar: StatusBarSprite = null
let megaAttackCooldownBar: StatusBarSprite = null

//make these sprites accessible from anywhere in the code
let player: Sprite = null
let car: Sprite = null

//Checks if settings have been edited, if not use default settings
//if you change these the game might break
let playerHealthS = settings.readNumber("playerHealthS") || 100
let playerSpeed = settings.readNumber("playerSpeed") || 85
let laserCooldown = settings.readNumber("laserCooldown") || 0.15                               //Laser cooldown after move in sec
let laserSpeed = settings.readNumber("laserSpeed") || 500

let megaAttackCooldownS = settings.readNumber("megaAttackCooldownS") || 8                     //Second attack cooldown after use in sec
let megaAttackTimesFired = settings.readNumber("megaAttackTimesFired") || 3                    //default 3
let megaAttackSpeed = settings.readNumber("megaAttackSpeed") || 100                            //Will break if set to 30 or below; default 100
let megaAttackTimeBetweenBursts = settings.readNumber("megaAttackTimeBetweenBursts") || 500    //milliseconds; default 500
let megaAttackEffect = settings.readNumber("megaAttackEffect") || 16                            //mega attack's effect on enemy1 (how fast enemies run away)
let megaAttackDamageDealtToBoss = settings.readNumber("megaAttackDamageDealtToBoss") || 3
let megaAttackLifeSpan = settings.readNumber("megaAttackLifeSpan") || 2000                     //Life spawn of projectiles; Set to 2000 for it to make it across the entire screen

let enemy1Freq = settings.readNumber("enemy1Freq") || 500                                      //lower = more (Time between spawn in ms)
let enemy1Speed = settings.readNumber("enemy1Speed") || -25
let enemy1Dodge = settings.readNumber("enemy1Dodge") || 60                                     //percent
let enemy2Freq = settings.readNumber("enemy2Freq") || 5000
let enemy2Speed = settings.readNumber("enemy2Speed") || -90
let enemy2Split = settings.readNumber("enemy2Split") || 50                                     //percent chance to split when destroyed

let bossSpawnNum = settings.readNumber("bossSpawnNum") || 100
let bossDodge = settings.readNumber("bossDodge") || 90                                           //percent

let carHealth = settings.readNumber("carHealth") || 165
let carSpeed = settings.readNumber("carSpeed") || -20
let carAttackInterval = settings.readNumber("carAttackInterval") || 500                //will break if set too low
let carProjectileSpeed = settings.readNumber("carProjectileSpeed") || 100
let carStunDuration = settings.readNumber("carStunDuration") || 1300

let ghostHealth = settings.readNumber("ghostHealth") || 70
let ghostSpeed = settings.readNumber("ghostSpeed") || -30
let ghostAttackInterval = settings.readNumber("ghostAttackInterval") || 1000
let ghostAttack2Interval = settings.readNumber("ghostAttack2Interval") || 1500


//variables(Don't change)
const minY = 25
let password = u8x3.d2(u8x3.rC(u8x3.sD("R90XIHnYEZqXKH1TPHDY", u8x3.rC(u8x3.d2("TFdNU0hZWENUSlZQWlJRTktCT1VGRElHRUE=")))))
let passwordAttempt = ""
let debug = 0
//let debugUsed = false
let bossSpawn = true
let unlimitedMegaAttack = false
let xMovement = false
let megaAttackCooldown = 0
let enemy1Count = 0
let nextBossSpawn = bossSpawnNum
let playerStunned = false
let laserCooldownTimer = 0


//scene
scene.setBackgroundImage(assets.image`backgroundEXTENDED`)

//display menu
mainMenuCreate()

//instructions function
function instructions() {
    game.splash("Read all the text carefully before playing the game")
    game.splash("This game is best played on a computer with a keyboard. Touch screens are not recommended and will make the game extremely difficult.")
    game.showLongText(
        "Controls:\n" +
        "- Move: Up and Down\n" +
        "- Hold A: Fire laser (only when not moving)\n" +
        "- Press B: Mega Attack fires 5 projectiles in 3 bursts\n" +
        "  (Pushes enemies back, " + megaAttackCooldownS + "s cooldown)",
        DialogLayout.Full
    )
    game.showLongText(
        "Enemies:\n" +
        "- Green Snake: -1 health, " + enemy1Dodge + "% chance to dodge lasers\n" +
        "- Blue Snake: -4 to -9 health, immune to Mega Attacks\n" +
        "  " + enemy2Split + "% chance to split into 4-9 Green Snakes",
        DialogLayout.Full
    )
    game.showLongText(
        "Bosses:\n" +
        "- Car: -100 health, spawns every " + bossSpawnNum + " Green Snakes\n" +
        "  Shoots stun projectiles. When stunned, you can't move\n" +
        "  or shoot lasers but can still use Mega Attack\n" +
        "  Dodges lasers " + bossDodge + "% of the time\n" +
        "- Ghost: -" + ghostHealth + " health, summons Green Snakes\n" +
        "  Randomly turns invisible and reappears elsewhere",
        DialogLayout.Full
    )
    game.showLongText(
        "Bars:\n" +
        "- Top bar: Green Snakes defeated (spawns boss)\n" +
        "- Cooldown bar: Mega Attack recharge\n" +
        "- Boss health bar: Current boss's remaining health",
        DialogLayout.Full
    )
    game.showLongText(
        "Goal:\n" +
        "Defend the bridge!\n" +
        "Don't let any enemies get through\n" +
        "Survive as long as possible!",
        DialogLayout.Full
    )
}

//menus
//convert array to menu items
function convertArrayToMenuItems(items: string[]) {
    let menuItems: miniMenu.MenuItem[] = []
    for (let i = 0; i < items.length; i++) {
        menuItems.push(miniMenu.createMenuItem(items[i]))
    }
    return menuItems
}

//main menu function
function mainMenuCreate() {
    let mainMenuItems = ["Start", "Instructions", "Settings"]
    let menu = miniMenu.createMenuFromArray(convertArrayToMenuItems(mainMenuItems))
    menu.setPosition(40,100)

    //function not used so sound doesn't play at start
    music.setVolume(0)
    menu.onSelectionChanged(function (selection: string, selectedIndex: number) {
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    })
    music.setVolume(170)

    let title = sprites.create(assets.image`title`)
    title.setScale(1.5)
    title.setPosition(screen.width/2,(screen.height/2)-40)

    //Random Sprites in background function
    function randomBackgroundSprites(image: Image) {
        for (let i = 0; i < randint(5,10); i++) {
            let menuBackgroundSprite = sprites.create(image, SpriteKind.MenuBackgroundSprite)
            menuBackgroundSprite.setPosition(randint(10,150),randint(10,110))
            menuBackgroundSprite.z = randint(-5,-1)
            menuBackgroundSprite.setScale(randint(0.75, 1.25))
            menuBackgroundSprite.setVelocity(randint(-200,200),randint(-200,200))
            menuBackgroundSprite.setBounceOnWall(true)
            if (Math.percentChance(50)) {
                menuBackgroundSprite.image.flipX()
            }
        }
    }
    randomBackgroundSprites(assets.image`player`)
    randomBackgroundSprites(assets.image`car`)
    randomBackgroundSprites(assets.image`carDefeated`)


    menu.onButtonPressed(controller.A, function (selection: string, selectedIndex: number) {
        if (selection == "Start") {
            //destroy all menu sprites
            sprites.destroy(menu)
            sprites.destroy(title)
            sprites.destroyAllSpritesOfKind(SpriteKind.MenuBackgroundSprite)

            //transition, countdown, then start game
            countdownToStart()
            startGame()
        } else if (selection == "Instructions") {
            instructions()
        } else if (selection == "Settings") {
            //if Settings is locked do password check
            if (settings.readString("Settings Unlocked") != "True") {
                if (passwordAttempt != password) {
                    passwordAttempt = game.askForString("Password", 15)
                    if (passwordAttempt != password) {
                        music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
                        game.splash("Invalid Password")
                        return
                    }
                }
            }

            //create settings menu if passed
            settings.writeString("Settings Unlocked","True")
            sprites.destroy(title)
            sprites.destroy(menu)
            settingsMenuCreate()
        }
    })
}

//sound on selection changed function
function menuSelectionChangedSound(menu: any) {
    menu.onSelectionChanged(function (selection: string, selectedIndex: number) {
        music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
    })
}

//Settings menus
//main settings menu
function settingsMenuCreate() {
    //Categories of settings
    let settingsCategories = [`General`,`Mega Attack`,`Enemies`,`Bosses`,`Reset to Defaults`,`Lock Settings`]

    //create menus
    let settingsCategoriesMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsCategories))
    settingsCategoriesMenu.setTitle("Settings Categories")
    settingsCategoriesMenu.setDimensions(120, 300)
    settingsCategoriesMenu.x -= 6
    menuSelectionChangedSound(settingsCategoriesMenu)

    //controls
    settingsCategoriesMenu.onButtonPressed(controller.A, function(selection: string, selectedIndex: number) {
        if (selection == "General") {
            settingsGeneralMenuCreate()
        } else if (selection == "Mega Attack") {
            settingsMegaMenuCreate()
        } else if (selection == "Enemies") {
            settingsEnemiesMenuCreate()
        } else if (selection == "Bosses") {
            settingsBossMenuCreate()
        } else if (selection == "Reset to Defaults") {
            let highScore = settings.readNumber("high-score")
            let unlocked = settings.readString("Settings Unlocked")
            settings.clear()
            settings.writeNumber("high-score", highScore)
            settings.writeString("Settings Unlocked", unlocked)
            game.splash("Resetted to Defalut Settings")
            game.splash("Restarting...")
            game.reset()
        } else if (selection == "Lock Settings") {
            settings.remove("Settings Unlocked")
            game.splash("Settings has been locked.")
            sprites.destroyAllSpritesOfKind(SpriteKind.MenuBackgroundSprite)
            mainMenuCreate()
        }

        sprites.destroy(settingsCategoriesMenu)
    })

    //return to main menu on B
    settingsCategoriesMenu.onButtonPressed(controller.B, function(selection: string, selectedIndex: number) {
        sprites.destroy(settingsCategoriesMenu)
        sprites.destroyAllSpritesOfKind(SpriteKind.MenuBackgroundSprite)
        mainMenuCreate()
    })
}

//return to settings categories on B function
function returnToCategoriesB(menu: any) {
    menu.onButtonPressed(controller.B, function(selection: string, selectedIndex: number) {
        sprites.destroy(menu)
        settingsMenuCreate()
    })
}

//General Settings menu
function settingsGeneralMenuCreate() {
    let settingsGeneral = [
        `Player Lives: ${playerHealthS}`,
        `Player Speed: ${playerSpeed}`,
        `Laser Cooldown: ${laserCooldown}s`,
        `Laser Speed: ${laserSpeed}`
    ]

    let settingsGeneralMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsGeneral))
    returnToCategoriesB(settingsGeneralMenu)
    menuSelectionChangedSound(settingsGeneralMenu)

    settingsGeneralMenu.onButtonPressed(controller.A, function(selection: string, selectedIndex: number) {

        if (selectedIndex == 0) {
            playerHealthS = game.askForNumber("Player Lives", 3)
            settings.writeNumber("playerHealthS",playerHealthS)
        } else if (selectedIndex == 1) {
            playerSpeed = game.askForNumber("Player Speed", 3)
            settings.writeNumber("playerSpeed",playerSpeed)
        } else if (selectedIndex == 2) {
            laserCooldown = game.askForNumber("Laser Cooldown", 4)
            settings.writeNumber("laserCooldown",laserCooldown)
        } else if (selectedIndex == 3) {
            laserSpeed = game.askForNumber("Laser Speed", 3)
            settings.writeNumber("laserSpeed",laserSpeed)
        }

        sprites.destroy(settingsGeneralMenu)
        settingsGeneralMenuCreate()
    })
}

//Mega Attack Settings menu
function settingsMegaMenuCreate() {
    let settingsMega = [
        `Cooldown: ${megaAttackCooldownS}sec`,
        `Bursts: ${megaAttackTimesFired}`,
        `Speed: ${megaAttackSpeed}`,
        `Time Between Bursts: ${megaAttackTimeBetweenBursts}ms`,
        `Effect on Enemies: ${megaAttackEffect}`,
        `Damage to Car: ${megaAttackDamageDealtToBoss}`,
        `Lifespan: ${megaAttackLifeSpan}ms`
    ]

    let settingsMegaMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsMega))
    returnToCategoriesB(settingsMegaMenu)
    menuSelectionChangedSound(settingsMegaMenu)

    settingsMegaMenu.onButtonPressed(controller.A, function (selection: string, selectedIndex: number) {
        if (selectedIndex == 0) {
            megaAttackCooldownS = game.askForNumber("Cooldown", 2)
            settings.writeNumber("megaAttackCooldownS", megaAttackCooldownS)
        } else if (selectedIndex == 1) {
            megaAttackTimesFired = game.askForNumber("Bursts", 2)
            settings.writeNumber("megaAttackTimesFired", megaAttackTimesFired)
        } else if (selectedIndex == 2) {
            megaAttackSpeed = game.askForNumber("Mega Attack Speed", 3)
            settings.writeNumber("megaAttackSpeed", megaAttackSpeed)
        } else if (selectedIndex == 3) {
            megaAttackTimeBetweenBursts = game.askForNumber("Delay", 4)
            settings.writeNumber("megaAttackTimeBetweenBursts", megaAttackTimeBetweenBursts)
        } else if (selectedIndex == 4) {
            megaAttackEffect = game.askForNumber("Effect", 2)
            settings.writeNumber("megaAttackEffect", megaAttackEffect)
        } else if (selectedIndex == 5) {
            megaAttackDamageDealtToBoss = game.askForNumber("Damage to Boss", 2)
            settings.writeNumber("megaAttackDamageDealtToBoss", megaAttackDamageDealtToBoss)
        } else if (selectedIndex == 6) {
            megaAttackLifeSpan = game.askForNumber("Lifespan", 4)
            settings.writeNumber("megaAttackLifeSpan", megaAttackLifeSpan)
        }

        sprites.destroy(settingsMegaMenu)
        settingsMegaMenuCreate()
    })
}

//Enemies Settings menu
function settingsEnemiesMenuCreate() {
    let settingsEnemies = [
        `Enemy1 Freq: ${enemy1Freq}ms`,
        `Enemy1 Speed: ${enemy1Speed}`,
        `Enemy1 Dodge: ${enemy1Dodge}%`,
        `Enemy2 Freq: ${enemy2Freq}ms`,
        `Enemy2 Speed: ${enemy2Speed}`,
        `Enemy2 Split: ${enemy2Split}%`
    ]

    let settingsEnemiesMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsEnemies))
    returnToCategoriesB(settingsEnemiesMenu)
    menuSelectionChangedSound(settingsEnemiesMenu)

    settingsEnemiesMenu.onButtonPressed(controller.A, function (selection: string, selectedIndex: number) {
        if (selectedIndex == 0) {
            enemy1Freq = game.askForNumber("Enemy1 Freq", 4)
            settings.writeNumber("enemy1Freq", enemy1Freq)
        } else if (selectedIndex == 1) {
            enemy1Speed = game.askForNumber("Enemy1 Speed", 3)
            settings.writeNumber("enemy1Speed", enemy1Speed)
        } else if (selectedIndex == 2) {
            enemy1Dodge = game.askForNumber("Enemy1 Dodge", 2)
            settings.writeNumber("enemy1Dodge", enemy1Dodge)
        } else if (selectedIndex == 3) {
            enemy2Freq = game.askForNumber("Enemy2 Freq", 4)
            settings.writeNumber("enemy2Freq", enemy2Freq)
        } else if (selectedIndex == 4) {
            enemy2Speed = game.askForNumber("Enemy2 Speed", 3)
            settings.writeNumber("enemy2Speed", enemy2Speed)
        } else if (selectedIndex == 5) {
            enemy2Split = game.askForNumber("Enemy2 Split", 2)
            settings.writeNumber("enemy2Split", enemy2Split)
        }

        sprites.destroy(settingsEnemiesMenu)
        settingsEnemiesMenuCreate()
    })
}

//boss settings menu
function settingsBossMenuCreate() {
    let settingsBoss = [
        `All`,
        `Car`,
        `Ghost`
    ]

    let settingsBossMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsBoss))
    returnToCategoriesB(settingsBossMenu)
    menuSelectionChangedSound(settingsBossMenu)

    settingsBossMenu.onButtonPressed(controller.A, function(selection: string, selectedIndex: number) {
        if (selection == `All`) {
            settingsGeneralBossesMenuCreate()
        } else if (selection == `Car`) {
            settingsCarMenuCreate()
        } else if (selection == `Ghost`) {
            settingsGhostMenuCreate()
        }

        sprites.destroy(settingsBossMenu)
    })
}

//General Bosses settings menu
function settingsGeneralBossesMenuCreate() {
    let settingsGeneralBosses = [
        `Boss Spawns Every: ${bossSpawnNum}`,
        `Boss Dodge: ${bossDodge}%`
    ]

    let settingsGeneralBossesMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsGeneralBosses))
    returnToCategoriesB(settingsGeneralBossesMenu)
    menuSelectionChangedSound(settingsGeneralBossesMenu)

    settingsGeneralBossesMenu.onButtonPressed(controller.A, function (selection: string, selectedIndex: number) {
        if (selectedIndex == 0) {
            bossSpawnNum = game.askForNumber("Spawn num", 3)
            settings.writeNumber("bossSpawnNum", bossSpawnNum)
        } else if (selectedIndex == 1) {
            bossDodge = game.askForNumber("Boss Dodge", 2)
            settings.writeNumber("bossDodge", bossDodge)
        }

        sprites.destroy(settingsGeneralBossesMenu)
        settingsGeneralBossesMenuCreate()
    })
}

//Car settings menu
function settingsCarMenuCreate() {
    let settingsCar = [
        `Car Health: ${carHealth}`,
        `Car Speed: ${carSpeed}`,
        `Car Fire Rate: ${carAttackInterval}ms`,
        `Car Bullet Speed: ${carProjectileSpeed}`,
        `Car Stun: ${carStunDuration}ms`,
    ]

    let settingsCarMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsCar))
    returnToCategoriesB(settingsCarMenu)
    menuSelectionChangedSound(settingsCarMenu)

    settingsCarMenu.onButtonPressed(controller.A, function (selection: string, selectedIndex: number) {
        if (selectedIndex == 0) {
            carHealth = game.askForNumber("Health", 3)
            settings.writeNumber("carHealth", carHealth)
        } else if (selectedIndex == 1) {
            carSpeed = game.askForNumber("Speed", 3)
            settings.writeNumber("carSpeed", carSpeed)
        } else if (selectedIndex == 2) {
            carAttackInterval = game.askForNumber("Car Fire Rate", 4)
            settings.writeNumber("carAttackInterval", carAttackInterval)
        } else if (selectedIndex == 3) {
            carProjectileSpeed = game.askForNumber("Bullet Speed", 3)
            settings.writeNumber("carProjectileSpeed", carProjectileSpeed)
        } else if (selectedIndex == 4) {
            carStunDuration = game.askForNumber("Stun Duration", 4)
            settings.writeNumber("carStunDuration", carStunDuration)
        }

        sprites.destroy(settingsCarMenu)
        settingsCarMenuCreate()
    })
}

//Ghost settings menu
function settingsGhostMenuCreate() {
    let settingsGhost = [
        `Ghost Health: ${ghostHealth}`,
        `Ghost Speed: ${ghostSpeed}`,
        `Ghost attack interval: ${ghostAttackInterval}ms`,
        `Ghost attack2 interval: ${ghostAttack2Interval}ms`
    ]

    let settingsGhostMenu = miniMenu.createMenuFromArray(convertArrayToMenuItems(settingsGhost))
    returnToCategoriesB(settingsGhostMenu)
    menuSelectionChangedSound(settingsGhostMenu)

    settingsGhostMenu.onButtonPressed(controller.A, function (selection: string, selectedIndex: number) {
        if (selectedIndex == 0) {
            ghostHealth = game.askForNumber("Health", 3)
            settings.writeNumber("ghostHealth", ghostHealth)
        } else if (selectedIndex == 1) {
            ghostSpeed = game.askForNumber("Speed", 3)
            settings.writeNumber("ghostSpeed", ghostSpeed)
        } else if (selectedIndex == 2) {
            ghostAttackInterval = game.askForNumber("Ghost Fire Rate", 4)
            settings.writeNumber("ghostAttackInterval", ghostAttackInterval)
        } else if (selectedIndex == 3) {
            ghostAttack2Interval = game.askForNumber("Ghost Attack2 Rate", 4)
            settings.writeNumber("ghostAttack2Interval", ghostAttack2Interval)
        }

        sprites.destroy(settingsGhostMenu)
        settingsGhostMenuCreate()
    })
}

//end of menus


//countdown function before game starts
function countdownToStart() {
    music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    screenTransitions.startTransition(screenTransitions.HorizontalSplit, 500, false)
    let three = textsprite.create("3",0,15)
    three.setMaxFontHeight(30)
    three.setPosition(screen.width/2,screen.height/2)
    pause(1500)
    sprites.destroy(three)
    let two = textsprite.create("2", 0, 15)
    two.setMaxFontHeight(30)
    two.setPosition(screen.width / 2, screen.height / 2)
    music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    pause(1500)
    sprites.destroy(two)
    let one = textsprite.create("1", 0, 15)
    one.setMaxFontHeight(30)
    one.setPosition(screen.width / 2, screen.height / 2)
    music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    pause(1500)
    sprites.destroy(one)
    music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
    screenTransitions.startTransition(screenTransitions.Dissolve, 500, false)
}


//game starts here
function startGame() {
    //start music
    music.play(music.createSong(assets.song`mySong`), music.PlaybackMode.LoopingInBackground)

    //timer
    let time = 0
    let timerText = textsprite.create("0:00", 0, 15)
    timerText.setPosition(80, 5)
    timerText.z = 6
    game.onUpdateInterval(1000, function () {
        time++
        let mins = Math.idiv(time, 60)
        let secs = time % 60
        timerText.setText(`${mins}:${secs < 10 ? "0" : ""}${secs}`)
    })

    //enemy1 count bar
    enemy1CountBar = statusbars.create(90, 2, StatusBarKind.Magic)
    enemy1CountBar.z = 5
    enemy1CountBar.max = bossSpawnNum
    enemy1CountBar.setPosition(86, 11)

    // DEBUG/CHEATS
    controller.combos.setTimeout(500)
    controller.combos.attachCombo("URDLUA+B", function () {
        //debugUsed = true
        if (passwordAttempt != password) {
            if (settings.readString("Settings Unlocked") != "True") {
                passwordAttempt = game.askForString("Password", 15)
            }
        }
        if (passwordAttempt == password || settings.readString("Settings Unlocked") == "True") {
            settings.writeString("Settings Unlocked", "True")
            debug = game.askForNumber("Code", 2)
            if (debug == 0) {
                enemy1Count = bossSpawnNum - 1
                enemy1CountBar.value = enemy1Count
                game.splash("Spawning boss")
            } else if (debug == 1) {
                bossSpawn = false
                game.splash("Disabled boss spawn")
            } else if (debug == 2) {
                info.setLife(999999)
                game.splash("Set life to 999999")
            } else if (debug == 3) {
                unlimitedMegaAttack = true
                game.splash("Unlimited Mega Attacks Enabled")
            } else if (debug == 4) {
                xMovement = true
                controller.moveSprite(player, playerSpeed, playerSpeed)
                game.splash("X movement has been unlocked!")
            } else if (debug == 99) {
                settings.remove("high-score")
                game.splash("High score has been cleared!")
            } else {
                music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
                game.splash("Invalid code")
                //debugUsed = false
            }
        } else {
            game.splash("Invalid password!!!")
        }
    })


    //player set up
    info.setLifeImage(assets.image`life`)
    info.setLife(playerHealthS)
    player = sprites.create(assets.image`player`, SpriteKind.Player)
    player.setPosition(0, 60)
    controller.moveSprite(player, 0, playerSpeed)
    player.setStayInScreen(true)

    //boundary to prevent player from going to resricted areas
    forever(function () {
        if (player.y <= minY) {
            player.y = minY
        }
    })

    //main attack
    //laser shoot
    forever(function () {
        if (controller.A.isPressed() && game.runtime() >= laserCooldownTimer && info.countdown() == 0 && controller.up.isPressed() == false && controller.down.isPressed() == false) {
            let laser = sprites.createProjectileFromSprite(assets.image`laser`, player, laserSpeed, 0)
            laser.x += 8
            laser.y += 4
            laser.z = 1
            music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
        }
    })

    //start laser cooldown when up or down button is released
    controller.up.onEvent(ControllerButtonEvent.Released, function () {
        if (game.runtime() >= laserCooldownTimer) {
            laserCooldownTimer = game.runtime() + laserCooldown * 1000
        }
    })
    controller.down.onEvent(ControllerButtonEvent.Released, function () {
        if (game.runtime() >= laserCooldownTimer) {
            laserCooldownTimer = game.runtime() + laserCooldown * 1000
        }
    })

    //player animation start
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        animation.stopAnimation(animation.AnimationTypes.All, player)
        animation.runImageAnimation(player, assets.animation`playerAttacking`, laserCooldown * 1000 / 4, false)
        player.setImage(assets.image`playerAttack`)
    })
    //player animation end
    controller.A.onEvent(ControllerButtonEvent.Released, function () {
        animation.stopAnimation(animation.AnimationTypes.All, player)
        animation.runImageAnimation(player, assets.animation`playerDeattacking`, laserCooldown * 1000 / 4, false)
        player.setImage(assets.image`player`)
    })

    //laser destroyed effect
    sprites.onDestroyed(SpriteKind.Projectile, function (sprite: Sprite) {
        let explosion = sprites.create(assets.image`explosion`, SpriteKind.Effect)
        explosion.setPosition(sprite.x, sprite.y)
        explosion.z = 2
        explosion.lifespan = 100
    })


    //mega attack
    //mega attack cooldown countdown
    game.onUpdateInterval(50, function () {
            if (megaAttackCooldown > 0 && megaAttackCooldownBar) {
                megaAttackCooldown -= 0.05
                megaAttackCooldownBar.value = megaAttackCooldown
            } else if (megaAttackCooldown <= 0 && megaAttackCooldownBar) {
                sprites.destroy(megaAttackCooldownBar)
            }
    })

    //mega attack projectile function
    function megaAttack(vx: number, vy: number) {
        let megaAttackProjectile = sprites.createProjectileFromSprite(assets.image`laser2`, player, vx, vy)
        megaAttackProjectile.setKind(SpriteKind.Projectile2)
        megaAttackProjectile.lifespan = megaAttackLifeSpan
    }
    //on B pressed
    controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
        if (megaAttackCooldown <= 0 || unlimitedMegaAttack == true) {
            megaAttackCooldownBar = statusbars.create(20, 5, StatusBarKind.Energy)
            megaAttackCooldownBar.max = megaAttackCooldownS
            megaAttackCooldownBar.setColor(5, 9)
            megaAttackCooldownBar.attachToSprite(player)
            megaAttackCooldown = megaAttackCooldownS

            //repeat (number of bursts)
            for (let i = 0; i < megaAttackTimesFired; i++) {
                //animation start and sound
                animation.runImageAnimation(player, assets.animation`playerAttacking`, laserCooldown * 1000 / 4, false)
                player.setImage(assets.image`playerAttack`)
                music.play(music.melodyPlayable(music.beamUp), music.PlaybackMode.InBackground)

                //projectiles2
                megaAttack(megaAttackSpeed - 30, -30)
                megaAttack(megaAttackSpeed - 10, -18)
                megaAttack(megaAttackSpeed, 0)
                megaAttack(megaAttackSpeed - 10, 18)
                megaAttack(megaAttackSpeed - 30, 30)

                //time between each burst
                pause(megaAttackTimeBetweenBursts)
            }
            //player animation end
            animation.runImageAnimation(player, assets.animation`playerDeattacking`, laserCooldown * 1000 / 4, false)
            player.setImage(assets.image`player`)
        }
    })



    //enemies
    //array of enemies
    let enemies: enemy[] = []
    //filter nulled
    forever(function () {
        enemies = enemies.filter(e => e.sprite != null)
    })

    //base enemy class
    class enemy {
        sprite: Sprite

        constructor(img: Image, speed: number) {
            this.sprite = sprites.createProjectileFromSide(img, speed, 0)
            this.sprite.y = randint(minY, screen.height - 10)
        }

        destroy() {
            sprites.destroy(this.sprite)
        }

        //override in sub classes
        overlapSuper(): void {
            return
        }
    }

    //enemy1 subclass
    class enemy1 extends enemy {
        constructor(x?: number, y?: number, count?: boolean) {
            super(assets.image`enemy1`, enemy1Speed)
            animation.runImageAnimation(this.sprite, assets.animation`enemy1Animation`, 100, true)
            this.sprite.setKind(SpriteKind.Enemy)
            if (count != true){
                enemy1Count++
                if (enemy1CountBar) {
                    enemy1CountBar.value = enemy1Count % bossSpawnNum
                }
            }
            if (x != null && y != null) {
                this.sprite.setPosition(x, y)
            }
        }

        overlapSuper() {
            //make enmey go slower or backwards by adding vx
            this.sprite.vx += megaAttackEffect
            //flips animation if it goes backwards
            if (this.sprite.vx > 0) {
                animation.runImageAnimation(this.sprite, assets.animation`enemy1AnimationFlipped`, 100, true)
            }
        }
    }

    //enemy1 spawn
    game.onUpdateInterval(enemy1Freq, function () {
        let e = new enemy1()
        enemies.push(e)
    })

    //enemy1 on destroyed
    sprites.onDestroyed(SpriteKind.Enemy, function (sprite: Sprite) {
        //damage the player if it went off the screen when it died
        if (sprite.x <= 0) {
            info.changeLifeBy(-1)
        } else if (sprite.x <= screen.width) {
            //dodge mechanic
            if (Math.percentChance(enemy1Dodge)) {
                //create clone of destroyed enemy
                let e = new enemy1(null,null,true)
                enemies.push(e)
                //move the clone up or down depending on its y position, if it is not too high or too low, 50 precent chance to go up or down
                if (sprite.y <= minY + 15) {
                    e.sprite.setPosition(sprite.x, sprite.y + 15)
                } else if (sprite.y >= 95) {
                    e.sprite.setPosition(sprite.x, sprite.y - 15)
                } else if (Math.percentChance(50)) {
                    e.sprite.setPosition(sprite.x, sprite.y + 15)
                } else {
                    e.sprite.setPosition(sprite.x, sprite.y - 15)
                }
            }
        }
        sprite = null
    })

    //Main attack overlaps enemy
    sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite: Sprite, otherSprite: Sprite) {
        sprites.destroy(sprite)
        for (let e of enemies) {
            if (e.sprite == otherSprite) {
                e.destroy()
            }
        }
    })
    //super overlaps enemy
    sprites.onOverlap(SpriteKind.Projectile2, SpriteKind.Enemy, function (sprite: Sprite, otherSprite: Sprite) {
        for (let e of enemies) {
            if (e.sprite == otherSprite) {
                e.overlapSuper()
            }
        }
    })

    //enemy2
    class enemy2 extends enemy {
        constructor() {
            super(assets.image`enemy2`, enemy2Speed)
            this.sprite.setKind(SpriteKind.Enemy2)
            animation.runImageAnimation(this.sprite, assets.animation`enemy2Animation`, 50, true)
            this.sprite.changeScale(1, ScaleAnchor.Middle)
        }
    }

    //enemy2 spawn
    game.onUpdateInterval(enemy2Freq, function () {
        let e = new enemy2()
        enemies.push(e)
    })

    //on Enemy2 Destroyed
    sprites.onDestroyed(SpriteKind.Enemy2, function (sprite: Sprite) {
        //damage the player if it went off the screen when it died
        if (sprite.x <= 0) {
            info.player1.changeLifeBy(randint(-9, -4))
        } else if (sprite.x <= screen.width) {
            //special effect
            let explosion = sprites.create(assets.image`explosion`, SpriteKind.Effect)
            explosion.setPosition(sprite.x, sprite.y)
            explosion.changeScale(1, ScaleAnchor.Middle)
            explosion.z = 3
            explosion.lifespan = 500

            //split mechanic
            if (Math.percentChance(enemy2Split)) {
                for (let i = 0; i < randint(4, 9); i++) {
                    let e = new enemy1(sprite.x + (randint(-35, 35)), sprite.y + (randint(-15, 15)))
                    if (e.sprite.y <= minY + 15) {
                        e.sprite.y += 15
                    } else if (e.sprite.y >= 95) {
                        e.sprite.y -= 15
                    }
                    enemies.push(e)
                }
            }
        }
        sprite = null
    })

    //enemy2 overlaps laser
    sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy2, function (sprite: Sprite, otherSprite: Sprite) {
        sprites.destroy(sprite)
        for (let e of enemies) {
            if (e.sprite == otherSprite) {
                e.destroy()
            }
        }
    })



    //Bosses
    //array of bosses
    let bosses: boss[] = []
    //filter nulled
    forever(function () {
        //delete destroyed bosses from array
        bosses = bosses.filter(b => b.sprite != null)
    })

    //types of bosses
    enum BossType {car,ghost}

    //base boss class
    class boss {
        sprite: Sprite
        health: number
        healthBar: StatusBarSprite
        type: BossType

        constructor(img: Image, speed: number, health: number, type: BossType) {
            this.health = health
            this.sprite = sprites.createProjectileFromSide(img, speed, 0)
            this.sprite.y = randint(minY, screen.height - 10)
            this.sprite.setKind(SpriteKind.EnemyBoss)
            this.healthBar = statusbars.create(30, 6, StatusBarKind.EnemyHealth)
            this.healthBar.attachToSprite(this.sprite)
            this.healthBar.max = health
            this.healthBar.value = health
            this.type = type
        }

        destroy() {
            if (!this.sprite) return
            sprites.destroy(this.healthBar)
            sprites.destroy(this.sprite)
        }

        damage() {
            //damage the car
            this.health -= 5
            this.healthBar.value = this.health
            //unhide if invisible
            if (this.sprite.flags & sprites.Flag.Invisible) {
                this.sprite.setFlag(SpriteFlag.Invisible, false)
                this.healthBar.setFlag(SpriteFlag.Invisible, false)
            }

            //destroy the car if health is less than 0
            if (this.health <= 0) {
                this.destroy()
            } else if (Math.percentChance(bossDodge) && this.sprite.x >= 0) {
                //car dodge mechanic(same as enemy1 dodge but moves 20 pixels))
                if (this.sprite.y <= minY + 20) {
                    this.sprite.setPosition(this.sprite.x, this.sprite.y + 20)
                } else if (this.sprite.y >= 90) {
                    this.sprite.setPosition(this.sprite.x, this.sprite.y - 20)
                } else if (Math.percentChance(50)) {
                    this.sprite.setPosition(this.sprite.x, this.sprite.y + 20)
                } else {
                    this.sprite.setPosition(this.sprite.x, this.sprite.y - 20)
                }
            }
        }

        damageSuper() {
            //unhide if invisible
            if (this.sprite.flags & sprites.Flag.Invisible) {
                this.sprite.setFlag(SpriteFlag.Invisible, false)
                this.healthBar.setFlag(SpriteFlag.Invisible, false)
            }

            //damage the car
            this.health -= megaAttackDamageDealtToBoss
            this.healthBar.value = this.health

            //slows the car if it is not already slowed
            if (this.sprite.vx <= -10) {
                this.sprite.vx += 5
            }

            //destroy the car if health is less than 0
            if (this.health <= 0) {
                this.destroy()
            }

        }
        //ovrride in subclass
        onDestroyed(): void {
            return
        }
        attack1(): enemy[] {
            return []
        }
        attack2(): void {
            return
        }
    }

    //boss spawn
    forever(function () {
        //spawns boss if enemy1 count divided by x has no remainder, enemy1 count is not zero, and no other car has already been spawned
        if (nextBossSpawn <= enemy1Count && bossSpawn == true) {
            if (Math.percentChance(50)) {
                let b = new car()
                bosses.push(b)
            } else {
                let b = new ghost()
                bosses.push(b)
            }
            nextBossSpawn += bossSpawnNum
        }
    })

    //boss destoyed
    sprites.onDestroyed(SpriteKind.EnemyBoss, function (sprite: Sprite) {
        for (let b of bosses) {
            if (b.sprite == sprite) {
                b.onDestroyed()
            }
        }
    })
    //boss overlaps
    //main attack overlaps boss
    sprites.onOverlap(SpriteKind.Projectile, SpriteKind.EnemyBoss, function (sprite: Sprite, otherSprite: Sprite) {
        sprites.destroy(sprite)
        for (let b of bosses) {
            if (b.sprite == otherSprite) {
                b.damage()
            }
        }
    })

    //mega attack overlaps boss
    sprites.onOverlap(SpriteKind.Projectile2, SpriteKind.EnemyBoss, function (sprite: Sprite, otherSprite: Sprite) {
        sprites.destroy(sprite)
        for (let b of bosses) {
            if (b.sprite == otherSprite) {
                b.damageSuper()
            }
        }
    })

    //car
    class car extends boss {
        constructor() {
            super(assets.image`car`, carSpeed, carHealth, BossType.car)
            animation.runImageAnimation(this.sprite, assets.animation`carAnimation`, 100, true)
            //prevent game end when countdown ends
            info.onCountdownEnd(function() {})
        }

        onDestroyed() {
            //damage the player
            if (this.sprite.x <= 0) {
                info.player1.changeLifeBy(-100)
            } else {
                //effect
                let explosionBig = sprites.create(assets.image`carDefeated`, SpriteKind.Effect)
                animation.runImageAnimation(explosionBig, assets.animation`carDefeatedAnimation`, 200, false)
                explosionBig.setPosition(this.sprite.x, this.sprite.y)
                explosionBig.z = 4
                explosionBig.lifespan = 1800
                this.sprite = null
                //plays sound 500 times for dramatic explosion
                for (let i = 0; i < 450; i++) {
                    music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.UntilDone)
                }
            }
        }

        attack1(): enemy[] {
            //if car sprite exsists and player is not already stunned create target sprite at current player position and shoots enemy projectile at target
            if (this.sprite != null && playerStunned == false) {
                let target = sprites.create(assets.image`target`, SpriteKind.Target)
                target.lifespan = 2000
                target.setPosition(player.x, player.y)
                //vx and vy set to 1 to avoid deletion from
                let enemyProjectile = sprites.createProjectileFromSprite(assets.image`enemyProjectile`, this.sprite, 1, 1)
                enemyProjectile.setKind(SpriteKind.CarProjectile)
                enemyProjectile.follow(target, carProjectileSpeed)

            }
            return []
        }
    }

    //car attack
    game.onUpdateInterval(carAttackInterval, function () {
        for (let b of bosses) {
            if (b.type == BossType.car) {
                b.attack1()
            }
        }
    })

    //car projectile overlaps target
    sprites.onOverlap(SpriteKind.CarProjectile, SpriteKind.Target, function (sprite: Sprite, otherSprite: Sprite) {
        if (sprite.overlapsWith(player) && playerStunned == false) {
            sprites.destroy(sprite)
            sprites.destroy(otherSprite)
            playerStunned = true
        } else {
            sprites.destroy(sprite)
            sprites.destroy(otherSprite)
        }
    })
    //handle car projectiles
    forever(function () {
        //if playerStunned is set to true
        if (playerStunned == true) {
            controller.moveSprite(player, 0, 0)
            player.sayText("Stunned", carStunDuration)
            info.startCountdown(carStunDuration/1000)
            pause(carStunDuration)
            controller.moveSprite(player, 0, playerSpeed)
            if (xMovement == true) {
                controller.moveSprite(player, playerSpeed, playerSpeed)
            }
            playerStunned = false
        }
        //if target is deleted before projectile hits
        for (let enemyProjectile of sprites.allOfKind(SpriteKind.CarProjectile)) {
            if (enemyProjectile.vx == 0 && enemyProjectile.vy == 0) {
                sprites.destroy(enemyProjectile)
            }
        }
    })
    //main attack overlaps car projectile
    sprites.onOverlap(SpriteKind.Projectile, SpriteKind.CarProjectile, function (sprite: Sprite, otherSprite: Sprite) {
        sprites.destroy(sprite)
        sprites.destroy(otherSprite)
    })


    //ghost boss
    class ghost extends boss {
        constructor() {
            super(assets.image`ghost`, ghostSpeed, ghostHealth, BossType.ghost)
            animation.runImageAnimation(this.sprite, assets.animation`ghostAnimation`, 500, true)
        }

        onDestroyed() {
            //damage the player
            if (this.sprite.x <= 0) {
                info.player1.changeLifeBy(-100)
            } else {
                //effect
                let ghostDefeated = sprites.create(assets.image`ghostDefeated`, SpriteKind.Effect)
                animation.runImageAnimation(ghostDefeated, assets.animation`ghostDefeatedAnimation`, 100, false)
                ghostDefeated.setPosition(this.sprite.x, this.sprite.y)
                ghostDefeated.z = 4
                ghostDefeated.lifespan = 1000
                ghostDefeated.changeScale(1,ScaleAnchor.Middle)
                this.sprite = null
                music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.UntilDone)
            }
        }

        attack1(): enemy[] {
            let spawned: enemy[] = []
            for (let i = 0; i < 4; i++) {
                let ex = this.sprite.x + randint(-30, 30)
                let ey = this.sprite.y + randint(-30, 30)
                if (ey < minY) {
                    ey = minY
                } else if (ey > screen.height - 10) {
                    ey = screen.height - 10
                }
                let e = new enemy1(ex, ey, true)
                spawned.push(e)
            }
            return spawned
        }
        attack2() {
            if (this.sprite.flags & sprites.Flag.Invisible) {
                this.sprite.setFlag(SpriteFlag.Invisible, false)
                this.healthBar.setFlag(SpriteFlag.Invisible, false)
            } else {
                this.sprite.y = randint(minY, screen.height - 10)
                this.sprite.setFlag(SpriteFlag.Invisible, true)
                this.healthBar.setFlag(SpriteFlag.Invisible, true)
            }
        }
    }

    //ghost attack
    game.onUpdateInterval(ghostAttackInterval, function () {
        for (let b of bosses) {
            if (b.type == BossType.ghost) {
                let spawned = b.attack1()
                for (let e of spawned) {
                    enemies.push(e)
                }
            }
        }
    })
    game.onUpdateInterval(ghostAttack2Interval, function () {
        for (let b of bosses) {
            if (b.type == BossType.ghost) {
                b.attack2()
            }
        }
    })



    //game end
    info.onLifeZero(function () {
        music.stopAllSounds()
        music.play(music.melodyPlayable(music.wawawawaa), music.PlaybackMode.InBackground)

        info.setScore(time)
        //differnt messages
        if (info.score() > settings.readNumber("high-score")) {
            game.splash("YOU DIED!!!!")
            game.splash("You survived " + info.score() + " seconds and beat the high score of " + settings.readNumber("high-score") + " seconds!")
            game.splash("Note: High scores only saves on this device.")
            settings.writeNumber("high-score", info.score())
            game.gameOver(true)
            game.reset()
        } else if (info.score() <= settings.readNumber("high-score")) {
            game.splash("YOU DIED!!!!")
            game.splash("You survived " + info.score() + " seconds and didn't beat the high score of " + settings.readNumber("high-score") + " seconds!")
            game.splash("Note: High scores only saves on this device.")
            game.gameOver(false)
            game.reset()
        } else if (!settings.readNumber("high-score")) {
            game.splash("YOU DIED!!!!")
            game.splash("Nobody has played this game on this browser yet.")
            game.splash("I guess you win")
            settings.writeNumber("high-score", info.score())
            game.gameOver(true)
            game.reset()
        }
    })
}