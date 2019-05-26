class SkyBox {
    constructor(game) {
        this.game = game;
    }

    init() {
        const getRandomStarColor = function() {
            let colorBase = Math.random();
            colorBase -= .5;
            if (colorBase > 0)
                return new THREE.Color(1, 1, 1 - colorBase);
            else
                return new THREE.Color(1 - colorBase, 1, 1);
        }

        const randomSpherePoint = function(x0, y0, z0, radius) {
           let u = Math.random();
           let v = Math.random();

           let theta = 2 * Math.PI * u;
           let phi = Math.acos(2 * v - 1);

           let x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
           let y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
           let z = z0 + (radius * Math.cos(phi));

           return {
               x: x, 
               y: y, 
               z: z
           };
        }

        this.stars = [];
        for (let i = 0; i < 1000; i++) {
            let star = new THREE.Mesh(new THREE.SphereGeometry(4, 7, 7), new THREE.MeshBasicMaterial({ 
                color: getRandomStarColor()
            }));

            let starPosition = randomSpherePoint(0, 0, 0, 2000 + (Math.random() * 200));
            star.position.x = starPosition.x;
            star.position.y = starPosition.y;
            star.position.z = starPosition.z;
            let initialScale = Math.random() * (3 - .5) + .5;
            star.scale.x = initialScale;
            star.scale.y = initialScale;
            star.scale.y = initialScale;
            star.currentShift = Math.round(Math.random());

            this.stars.push(star);
            this.game.environment.scene.add(star);
        }
    }

    frame() { 
        this.stars.forEach(function(star) {
            let change = (star.currentShift == 1 ? 1 : -1) * 0.02;
            star.scale.x += change;
            star.scale.y += change;
            star.scale.z += change;
            if (star.scale.x > 3)
                star.currentShift = 0;
            if (star.scale.x < .5)
                star.currentShift = 1;
        });
    }
}

class GlobalLightning {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.lights = {};

        this.lights.mainAmbient = new THREE.AmbientLight(0xffffff, 0.1);
        this.game.environment.scene.add(this.lights.mainAmbient);

        this.lights.mainSpotLight = new THREE.SpotLight(0xffffff, 2);
        this.lights.mainSpotLight.position.set(0, 0, 100);
        this.lights.mainSpotLight.angle = Math.PI / 2;
        this.lights.mainSpotLight.penumbra = 0.05;
        this.lights.mainSpotLight.decay = 2;
        this.lights.mainSpotLight.distance = 600;
        this.lights.mainSpotLight.castShadow = true;
        this.lights.mainSpotLight.shadow.mapSize.width = 1024;
        this.lights.mainSpotLight.shadow.mapSize.height = 1024;
        this.lights.mainSpotLight.shadow.camera.near = 10;
        this.lights.mainSpotLight.shadow.camera.far = 200;
        this.game.environment.scene.add(this.lights.mainSpotLight);
    }

    frame() { }
}

class Main2DBox {
    constructor(game) {
        this.game = game;
        this.mousePoint = undefined;
        this.raycaster = new THREE.Raycaster();
    }

    init() {
        this.box = new THREE.Mesh(new THREE.BoxGeometry(320, 220, 10), new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            opacity: 0,
            transparent: true
        }));
        this.game.environment.scene.add(this.box);
    }

    frame() {
        this.raycaster.setFromCamera(this.game.environment.mouse, this.game.environment.camera);
        let intersects = this.raycaster.intersectObjects([this.box], true);
        this.mousePoint = intersects.length > 0 ? intersects[0].point : this.mousePoint;
    }
}

class Environment {
    constructor(game) {
        this.game = game;
        this.skybox = new SkyBox(game);
        this.globalLightning = new GlobalLightning(game);
        this.main2dbox = new Main2DBox(game);
        this.mouse = new THREE.Vector2();
    }

    init(bodyElement) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;

        bodyElement.appendChild(this.renderer.domElement);

        let environment = this;
        window.addEventListener('mousemove', function(event) {
            environment.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            environment.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        this.skybox.init();
        this.globalLightning.init();
        this.main2dbox.init();
    }

    frame() {
        this.skybox.frame();
        this.globalLightning.frame();
        this.main2dbox.frame();
    }
}

class Scene {
    constructor(game) {
        this.game = game;
        this.rootObject = new THREE.Object3D();
    }

    init() { 
        this.rootObject = new THREE.Object3D();
    }

    frame() { }

    mouseDown() { }

    mouseUp() { }

    keyDown(keyInfo) { }

    keyUp(keyInfo) { }
}

class SimpleButton {
    constructor(game, x, y, w, h, text, colorNormal, colorHover, colorPressed, clickCallback) {
        this.game = game;

        this.raycaster = new THREE.Raycaster();

        this.normalMaterial = new THREE.MeshPhongMaterial({
            color: colorNormal,
        });
        this.hoverMaterial = new THREE.MeshPhongMaterial({
            color: colorHover,
        });
        this.pressedMaterial = new THREE.MeshPhongMaterial({
            color: colorPressed,
        });
        this.baseObject = new THREE.Mesh(new THREE.BoxGeometry(w, h, 20), this.normalMaterial);
        this.baseObject.position.x = x + w / 2;
        this.baseObject.position.y = y + h / 2;

        this.clickCallback = clickCallback;

        this.isPressed = false;
    }

    addToScene(rootObject) {
        rootObject.add(this.baseObject);
    }

    inButton() {
        this.raycaster.setFromCamera(this.game.environment.mouse, this.game.environment.camera);
        let intersects = this.raycaster.intersectObjects([this.baseObject], true);
        return intersects.length > 0;
    }

    frame() {
        if (this.isPressed) {
            this.baseObject.position.z = -2;
            this.baseObject.scale.z = 0.8;
            this.baseObject.material = this.pressedMaterial;
        } else {
            this.baseObject.position.z = 0;
            this.baseObject.scale.z = 1;
            this.baseObject.material = this.inButton() ? this.hoverMaterial : this.normalMaterial;
        }
    }

    mouseDown() {
        if (this.inButton()) {
            this.isPressed = true;
        }
    }

    mouseUp() {
        this.isPressed = false;
        if (this.inButton()) {
            if (this.clickCallback == undefined)
                return;
            this.clickCallback();
        }
    }
}

class SettingsScene extends Scene {
    constructor(game) {
        super(game);
    }
}

class MainMenuScene extends Scene {
    constructor(game) {
        super(game);
    }

    init() {
        super.init();
        let game = this.game;

        this.playButton = new SimpleButton(this.game, 150 - 100, -10, 100, 20, "Play", 0x06b8af, 0x2af7ed, 0x035450, function() {
            game.sceneManager.setScene("game");
        });
        this.playButton.addToScene(this.rootObject);
        this.settingsButton = new SimpleButton(this.game, 150 - 100, -35, 100, 20, "Settings", 0x06b8af, 0x2af7ed, 0x035450, function() {
            game.sceneManager.setScene("settings");
        });
        this.settingsButton.addToScene(this.rootObject);
    }

    frame() {
        this.playButton.frame();
        this.settingsButton.frame();
    }

    mouseDown() {
        this.playButton.mouseDown();
        this.settingsButton.mouseDown();
    }

    mouseUp() {
        this.playButton.mouseUp();
        this.settingsButton.mouseUp();
    }
}

function getSizeByBB(object) {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    return Math.max(size.x, size.y) / 2 * 1.41;
}

class GameScene extends Scene {
    constructor(game) {
        super(game);
    }

    init() { 
        this.meshes = [];

        this.ships = [];
        this.shipGroup = new THREE.Object3D();
        for (let i = 0; i < 2; i++) {
            this.ships.push(this.getShip(i));
            this.shipGroup.add(this.ships[i]);
            this.meshes.push({
                x: this.ships[i].position.x,
                y: this.ships[i].position.y,
                r: getSizeByBB(this.ships[i])
            });
        }
        this.rootObject.add(this.shipGroup);

        this.planets = [];
        this.planetGroup = new THREE.Object3D(); 
        for (let i = 0; i < 20; i++) {
            this.planets.push(this.getPlanet(i));
            this.planetGroup.add(this.planets[i]);
            this.meshes.push({
                x: this.planets[i].position.x,
                y: this.planets[i].position.y,
                r: getSizeByBB(this.planets[i])
            });
        }
        this.rootObject.add(this.planetGroup);

        this.bulletTraceGroup = new THREE.Object3D();        
        this.bulletTraces = [];
        for (let i = 0; i < 5; i++) {
            this.bulletTraces.push(this.getBulletTrace(i));
            this.bulletTraceGroup.add(this.bulletTraces[i]);
        }
        this.rootObject.add(this.bulletTraceGroup);

        this.bullet = this.getBullet();
        this.rootObject.add(this.bullet);

        this.initGame();
    }

    getUnMeshedPosition(object) {
        let size = getSizeByBB(object);
        while (true) {
            let x = (Math.random() - 0.5) * 300;
            let y = (Math.random() - 0.5) * 200;
            let meshesCount = this.meshes.length;
            let failed = false;
            for (let i = 0; i < meshesCount; i++) {
                let distance = ((x - this.meshes[i].x) * (x - this.meshes[i].x) + (y - this.meshes[i].y) * (y - this.meshes[i].y)) - (this.meshes[i].r * this.meshes[i].r) - (size * size);
                if (distance < 0) {
                    failed = true;
                    break;
                }
            }
            if (!failed)
                return {
                    x: x,
                    y: y
                };
        }
    }

    getShip(id) {
        let shipGeometry = new THREE.BoxGeometry(10, 10, 10);
        let shipMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF
        });
        let shipMesh = new THREE.Mesh(shipGeometry, shipMaterial);
        let newPosition = this.getUnMeshedPosition(shipMesh);
        shipMesh.position.x = newPosition.x;
        shipMesh.position.y = newPosition.y;
        shipMesh.visible = false;
        return shipMesh;
    }

    getPlanet(id) {
        let radius = Math.random() * 7 + 8;
        let planetGeometry = new THREE.SphereGeometry(radius, 20, 20);
        let planetMaterial = new THREE.MeshPhongMaterial({
            color: 0x00FF00
        });
        let planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        let newPosition = this.getUnMeshedPosition(planetMesh);
        planetMesh.radius = radius;
        planetMesh.position.x = newPosition.x;
        planetMesh.position.y = newPosition.y;
        planetMesh.visible = false;
        return planetMesh;
    }

    getBulletTrace(id) {
        return new THREE.Object3D();
    }

    getBullet() {
        let bulletGeometry = new THREE.SphereGeometry(2.5, 10, 10);
        let bulletMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFF00
        });
        let bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bulletMesh.visible = false;
        bulletMesh.velocity = new THREE.Vector2();
        return bulletMesh;
    }

    initGame() {
        this.player = 0;
        this.state = 0;

        this.ships.forEach(function(ship) {
            ship.visible = true;
        });

        this.planets.forEach(function(ship) {
            ship.visible = true;
        });
    }

    mouseDown() {
        if (this.state == 0) {
            this.state = 1;
            this.bullet.position.x = this.ships[this.player].position.x;
            this.bullet.position.y = this.ships[this.player].position.y;
            this.bullet.velocity.x = this.game.environment.main2dbox.mousePoint.x - this.bullet.position.x;
            this.bullet.velocity.y = this.game.environment.main2dbox.mousePoint.y - this.bullet.position.y;
            this.bullet.visible = true;
        }
    }

    explode(x, y) {

    }

    frame() {
        let t = this.game.delta / 1000;
        if (this.state == 1) {
            this.bullet.position.x += this.bullet.velocity.x * t;
            this.bullet.position.y += this.bullet.velocity.y * t;

            // bullet physics

            if (Math.abs(this.bullet.position.x) > 160 || Math.abs(this.bullet.position.y) > 110) {
                this.bullet.visible = false;
                this.explode(this.bullet.position.x, this.bullet.position.y);
                this.state = 0;
                this.player = 1 - this.player;
                return;
            }

            let planetCollision = false;

            {
                let bulletX = this.bullet.position.x;
                let bulletY = this.bullet.position.y;

                let planetCount = this.planets.length;
                for (let i = 0; i < planetCount; i++) {
                    let distance = 
                        ((bulletX - this.planets[i].position.x) * (bulletX - this.planets[i].position.x) + (bulletY - this.planets[i].position.y) * (bulletY - this.planets[i].position.y)) - 
                        (this.planets[i].radius * this.planets[i].radius);
                    if (distance < 0) {
                        planetCollision = true;
                        break;
                    }
                }
            }

            if (planetCollision) {
                this.bullet.visible = false;
                this.explode(this.bullet.position.x, this.bullet.position.y);
                this.state = 0;
                this.player = 1 - this.player;
                return;
            }

            let opponentCollision = false;
            let opponentId = (1 - this.player);

            {
                let bulletX = this.bullet.position.x;
                let bulletY = this.bullet.position.y;

                let distance = 
                    ((bulletX - this.ships[opponentId].position.x) * (bulletX - this.ships[opponentId].position.x) + (bulletY - this.ships[opponentId].position.y) * (bulletY - this.ships[opponentId].position.y)) - 
                    (7 * 7);
                if (distance < 0) 
                    opponentCollision = true;
            }

            if (opponentCollision) {
                console.info("shot " + (1 - this.player));
                this.bullet.visible = false;
                this.explode(this.bullet.position.x, this.bullet.position.y);
                this.state = 0;
                this.player = 1 - this.player;
                return;
            }
        }
    }
}

class SceneManager {
    constructor(game) {
        this.game = game;
        this.scenes = {};
        this.currentSceneId = undefined;
    }

    addScene(id, scene) {
        if (this.scenes[id] != undefined) 
            throw "scene " + id + " already exists";
        this.scenes[id] = scene;
    }

    setScene(id) {
        if (this.scenes[id] == undefined) 
            throw "scene " + id + " does not exist";
        if (this.currentSceneId != undefined) {
            this.game.environment.scene.remove(this.scenes[this.currentSceneId].rootObject);            
        }
        this.currentSceneId = id;
        this.scenes[this.currentSceneId].init();
        this.game.environment.scene.add(this.scenes[this.currentSceneId].rootObject);      
    }

    getCurrentScene() {
        return this.currentSceneId == undefined ? undefined : this.scenes[this.currentSceneId];
    }
}

class Game {
    constructor() {
        this.delta = 0;
        this.previous = undefined;
        this.environment = new Environment(this);
        this.environment.init(document.body);

        this.sceneManager = new SceneManager(this);
        this.sceneManager.addScene("main-menu", new MainMenuScene(this));
        this.sceneManager.addScene("settings", new SettingsScene(this));
        this.sceneManager.addScene("game", new GameScene(this));
        this.sceneManager.setScene("main-menu");
    }

    run() {
        requestAnimationFrame(this.getFrameRenderFunction(this));
        let game = this;
        window.addEventListener('resize', function() {
            game.updateWindow();
        }, false);
        window.addEventListener('mousedown', function() {
            game.mouseDown();
        }, false);
        window.addEventListener('mouseup', function() {
            game.mouseUp();
        }, false);
        window.addEventListener('keydown', function(event) {
            game.keyDown(event);
        }, false);
        window.addEventListener('keyup', function(event) {
            game.keyUp(event);
        }, false);
        this.updateWindow();
    }

    mouseDown() {
        this.sceneManager.getCurrentScene().mouseDown();
    }

    mouseUp() {
        this.sceneManager.getCurrentScene().mouseUp();
    }

    keyDown(keyInfo) {
        this.sceneManager.getCurrentScene().keyDown(keyInfo);
    }

    keyUp(keyInfo) {
        this.sceneManager.getCurrentScene().keyUp(keyInfo);
    }

    updateWindow() {
        this.environment.camera.aspect = window.innerWidth / window.innerHeight;

        const fitCameraToObject = function(camera, object) {
            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(object);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const neededHeight = Math.max(size.y + 20, (size.x + 20) / camera.aspect);
            const vFOV = THREE.Math.degToRad(camera.fov);
            camera.position.z = neededHeight / 2 / Math.tan(vFOV / 2);
        }

        fitCameraToObject(this.environment.camera, this.environment.main2dbox.box);

        this.environment.camera.updateProjectionMatrix();
        this.environment.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getFrameRenderFunction(game) {
        return function(timestamp) {
            game.frame(timestamp);
        }
    }

    frame(timestamp) {
        if (this.previous != undefined)
            this.delta = timestamp - this.previous;
        this.previous = timestamp;
        this.environment.frame();
        this.sceneManager.getCurrentScene().frame();
        this.environment.renderer.render(this.environment.scene, this.environment.camera);
        requestAnimationFrame(this.getFrameRenderFunction(this));
    }
}

window.onload = function() {
    window.game = new Game();
    window.game.run();
}

/*


window.onload = function() {
    var geometry = new THREE.BoxGeometry(300, 200, 10);
    var material = new THREE.MeshPhongMaterial({
        color: 0x00ff00
    });
    var verticalBorderTexture = new THREE.TextureLoader().load('/content/img/border.png');
    verticalBorderTexture.wrapS = THREE.RepeatWrapping;
    verticalBorderTexture.wrapT = THREE.RepeatWrapping;
    verticalBorderTexture.repeat.x = 150 / 10;
    verticalBorderTexture.repeat.y = 1;
    var horizontalBorderTexture = new THREE.TextureLoader().load('/content/img/border.png');
    horizontalBorderTexture.wrapS = THREE.RepeatWrapping;
    horizontalBorderTexture.wrapT = THREE.RepeatWrapping;
    horizontalBorderTexture.repeat.y = 100 / 10;
    horizontalBorderTexture.repeat.x = 1;
    var cube = new THREE.Mesh(geometry, [
        new THREE.MeshPhongMaterial({
            transparent: true,
            map: horizontalBorderTexture,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({
            transparent: true,
            map: horizontalBorderTexture,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({
            transparent: true,
            map: verticalBorderTexture,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({
            transparent: true,
            map: verticalBorderTexture,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0,
            color: 0xff00ff,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0,
            color: 0xff00ff,
            side: THREE.DoubleSide
        })
    ]);
    scene.add(cube);
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        const fitCameraToObject = function(camera, object) {
            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(object);
            const size = boundingBox.getSize();
            var neededHeight = Math.max(size.y + 20, (size.x + 20) / camera.aspect);
            var vFOV = THREE.Math.degToRad(camera.fov);
            camera.position.z = neededHeight / 2 / Math.tan(vFOV / 2);
        }
        fitCameraToObject(camera, cube, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
    var loader = new THREE.OBJLoader();
    var ship;
    var ship2;
    loader.load('/content/models/ship.obj', function(object) {
        ship = object;
        object.rotation.x = Math.PI / 2;
        object.rotation.y = Math.PI / 2;
        scene.add(object);
    }, function() {}, function(error) {
        console.error(error);
    });
    loader.load('/content/models/ship.obj', function(object) {
        ship2 = object;
        object.rotation.x = Math.PI / 2;
        object.rotation.y = Math.PI / 2;
        scene.add(object);
    }, function() {}, function(error) {
        console.error(error);
    });
    var time = 0;
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var animate = function() {
        time += 0.1;
        requestAnimationFrame(animate);
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects([cube], true);
        if (intersects.length > 0) {
            ship2.position.x = intersects[0].point.x;
            ship2.position.y = intersects[0].point.y;
        }
        ship.rotation.z = Math.sin(time * 0.5) / 3;
        ship2.rotation.z = Math.sin(time * 0.5 + 1) / 3;
        renderer.render(scene, camera);
    };
    window.onmousemove = function(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    animate();
}*/