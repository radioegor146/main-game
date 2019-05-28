// --- SOME CONSTANTS ---

window.G = 10;
window.boxWidth = 300;
window.boxHeight = 200;

// --- CODE ---

Math.clamp = function(num, min, max) {
    return Math.min(Math.max(num, min), max);
};

window.objLoader = new THREE.OBJLoader();
window.textureLoader = new THREE.TextureLoader();

function loadModel(path) {
    var result = $.Deferred();
    objLoader.load(path, function(object) {
        result.resolve(object);
    }, function() { }, function(error) {
        result.reject();
    })
    return result.promise();
}

function loadTexture(path) {
    var result = $.Deferred();
    textureLoader.load(path, function(object) {
        result.resolve(object);
    }, function() { }, function(error) {
        result.reject();
    })
    return result.promise();
}

function randomSpherePoint(x0, y0, z0, radius) {
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
        this.box = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10), new THREE.MeshPhongMaterial({
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
        this.sceneOrtho = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.cameraOrtho = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, 1, 10);
        this.cameraOrtho.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.autoClear = false;

        this.renderer.domElement.oncontextmenu = function() { return false; }
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
        this.rootObjectOrtho = new THREE.Object3D();
    }

    init() { 
        this.rootObject = new THREE.Object3D();
        this.rootObjectOrtho = new THREE.Object3D();
    }

    frame() { }

    mouseDown(event) { }

    mouseUp(event) { }

    keyDown(keyInfo) { }

    keyUp(keyInfo) { }

    allowZoom() { return false; }
}

class MainMenuScene extends Scene {
    constructor(game) {
        super(game);

        this.raycaster = new THREE.Raycaster();
    }

    async asyncPreInit() {
        this.logoTexture = await loadTexture('/content/img/logo.png');

        this.logoTexture.minFilter = THREE.LinearFilter;

        this.normalTexture = await loadTexture('/content/img/button.png');
        this.hoverTexture = await loadTexture('/content/img/button_hover.png');
        this.pressedTexture = await loadTexture('/content/img/button_pressed.png');

        this.normalTexture.minFilter = THREE.LinearFilter;
        this.hoverTexture.minFilter = THREE.LinearFilter;
        this.pressedTexture.minFilter = THREE.LinearFilter;

        return this;
    }

    init() {
        super.init();
        document.body.style.cursor = '';

        this.logoMaterial = new THREE.SpriteMaterial({
            map: this.logoTexture
        });
        this.logoObject = new THREE.Sprite(this.logoMaterial);
        this.logoObject.scale.set(this.logoObject.material.map.image.width, this.logoObject.material.map.image.height, 1);
        this.logoObject.center.set(0.5, 0);
        this.rootObjectOrtho.add(this.logoObject);

        this.normalMaterial = new THREE.SpriteMaterial({
            map: this.normalTexture
        });
        this.hoverMaterial = new THREE.SpriteMaterial({
            map: this.hoverTexture
        });
        this.pressedMaterial = new THREE.SpriteMaterial({
            map: this.pressedTexture
        });

        this.playButton = new THREE.Sprite(this.normalMaterial);
        this.playButton.scale.set(this.playButton.material.map.image.width, this.playButton.material.map.image.height, 1);
        this.playButton.center.set(0.5, 0);
        this.rootObjectOrtho.add(this.playButton);
    }

    inButton() {
        this.raycaster.setFromCamera(this.game.environment.mouse, this.game.environment.cameraOrtho);
        let intersects = this.raycaster.intersectObjects([this.playButton], true);
        return intersects.length > 0;
    }

    frame() {
        this.playButton.position.set(window.innerWidth / 2, window.innerHeight / 6, 1); 
        this.logoObject.position.set(window.innerWidth / 2, window.innerHeight - window.innerHeight / 6 - this.logoObject.material.map.image.height, 1); 
        this.playButton.material = this.isPressed ? this.pressedMaterial : (this.inButton() ? this.hoverMaterial : this.normalMaterial);
    }

    mouseDown(event) {
        if (event.button != 0)
            return;
        if (this.inButton()) {
            this.isPressed = true;
        }
    }

    mouseUp(event) {
        if (event.button != 0)
            return;
        this.isPressed = false;
        if (this.inButton()) {
            this.game.sceneManager.setScene('game');
        }
    }
}

function getSizeByBB(object) {
    let boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);
    let size = new THREE.Vector3();
    boundingBox.getSize(size);
    return Math.max(size.x, size.y) / 2 * 1.41;
}

class GameScene extends Scene {
    constructor(game) {
        super(game);
    }

    async asyncPreInit() {
        this.shipMesh = await loadModel("/content/models/ship.obj");
        return this;
    }

    init() { 
        if (this.deathIntervalId != undefined)
            clearInterval(this.deathIntervalId);

        this.animationFrame = 0;

        for (let tries = 0; tries < 10; tries++) {
            let success = false;

            try {
                super.init();
                document.body.style.cursor = 'crosshair';

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
                success = true;
            } catch (error) {
                console.error("Error while generating level: " + error + ". Regenerating...");
            }

            if (success)
                break;
        }

        this.initGame();
    }

    getUnMeshedPosition(object) {
        return this.getUnMeshedPositionBySize(getSizeByBB(object));
    }

    getUnMeshedPositionBySize(size) {
        for (let tries = 0; tries < 10000; tries++) {
            let x = (Math.random() - 0.5) * window.boxWidth;
            let y = (Math.random() - 0.5) * window.boxHeight;
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
        throw "can't find place";
    }

    getShip(id) {
        let shipMesh = this.shipMesh.clone();        
        shipMesh.rotation.x = Math.PI / 2;
        shipMesh.rotation.y = Math.PI / 2;    
        if (id == 1)
            shipMesh.rotation.y += Math.PI;
        shipMesh.scale.multiplyScalar(2);
        let newPosition = this.getUnMeshedPositionBySize(200);
        if (id == 0) {
            while (newPosition.x > 0)
                newPosition = this.getUnMeshedPositionBySize(200);
        } else {
            while (newPosition.x < 0)
                newPosition = this.getUnMeshedPositionBySize(200);
        }
        shipMesh.position.x = newPosition.x;
        shipMesh.position.y = newPosition.y;
        shipMesh.visible = false;
        return shipMesh;
    }

    getPlanet(id) {
        let radius = Math.random() * 7 + 8;
        let planetGeometry = new THREE.SphereGeometry(radius, 14, 7);
        let planetMaterial = new THREE.MeshPhongMaterial({
            color: 0x00FF00,
            flatShading: true
        });
        let planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        let newPosition = this.getUnMeshedPosition(planetMesh);
        planetMesh.radius = radius;
        planetMesh.position.x = newPosition.x;
        planetMesh.position.y = newPosition.y;
        planetMesh.rotation.x = Math.random() * 2 * Math.PI;
        planetMesh.rotation.y = Math.random() * 2 * Math.PI;
        planetMesh.rotation.z = Math.random() * 2 * Math.PI;
        planetMesh.visible = false;
        return planetMesh;
    }

    getBulletTrace(id) {
        let bulletTraceGeometry = new THREE.SphereGeometry(2.5 - id / 3, 10, 10);
        let bulletTraceMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000
        });
        let bulletTraceMesh = new THREE.Mesh(bulletTraceGeometry, bulletTraceMaterial);
        return bulletTraceMesh;
    }

    getBullet() {
        let bulletGeometry = new THREE.SphereGeometry(2.5, 10, 10);
        let bulletMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFF00
        });
        let bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bulletMesh.visible = false;
        bulletMesh.velocity = new THREE.Vector2();
        bulletMesh.acceleration = new THREE.Vector2();
        bulletMesh.force = new THREE.Vector2();
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

    keyDown(keyInfo) {
        if (keyInfo.keyCode == 27)
            this.game.sceneManager.setScene('main-menu');
    }

    mouseDown(event) {
        if (event.button != 0)
            return;
        if (this.state == 0) {
            this.state = 1;
            this.bullet.position.x = this.ships[this.player].position.x;
            this.bullet.position.y = this.ships[this.player].position.y;
            this.bullet.velocity.x = this.game.environment.main2dbox.mousePoint.x - this.bullet.position.x;
            this.bullet.velocity.y = this.game.environment.main2dbox.mousePoint.y - this.bullet.position.y;
            this.bullet.velocity.clampLength(1, 120);
            this.bullet.acceleration = new THREE.Vector2();
            this.bullet.force = new THREE.Vector2();
            this.bulletTraces.forEach(function(bulletTrace) {
                bulletTrace.visible = false;
            });
            this.bullet.visible = true;
        }
    }

    explode(x, y) {
        let explosionObject = new THREE.Mesh(new THREE.SphereGeometry(10, 14, 7), new THREE.MeshPhongMaterial({
            color: 0xFFBB00,
            flatShading: true
        }));
        explosionObject.position.x = x;
        explosionObject.position.y = y;
        explosionObject.rotation.x = Math.random() * 2 * Math.PI;
        explosionObject.rotation.y = Math.random() * 2 * Math.PI;
        explosionObject.rotation.z = Math.random() * 2 * Math.PI;
        this.rootObject.add(explosionObject);
        let gameScene = this;
        let currentState = 0;
        let intervalId = setInterval(function() {
            if (currentState <= 0xBB) {
                explosionObject.material.color = new THREE.Color(1, (0xBB - currentState) / 256, 0);
                currentState += 24;
            } else {
                if (explosionObject.scale.x > 0) {
                    explosionObject.scale.x -= 0.05;
                    explosionObject.scale.y -= 0.05;
                    explosionObject.scale.z -= 0.05;
                } else {
                    gameScene.rootObject.remove(explosionObject);
                    clearInterval(intervalId);
                }
            }
            currentState++;
        }, 1000 / 60);
    }

    changeState() {
        this.bullet.visible = false;
        this.state = 0;
        this.player = 1 - this.player;
    }

    checkCollision(position) {
        let bulletX = position.x; 
        let bulletY = position.y; 

        if (Math.abs(bulletX) > window.boxWidth || Math.abs(bulletY) > window.boxHeight) 
            return 1; 

        let planetCollision = false; 

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

        if (planetCollision) 
            return 2;

        let opponentCollision = false;
        let opponentId = (1 - this.player);

        let distance = 
            ((bulletX - this.ships[opponentId].position.x) * (bulletX - this.ships[opponentId].position.x) + (bulletY - this.ships[opponentId].position.y) * (bulletY - this.ships[opponentId].position.y)) - 
            (7 * 7);
        if (distance < 0) 
            opponentCollision = true;

        if (opponentCollision) 
            return 3;

        return 0;
    }

    singleStep(position, velocity, delta) {
        let bulletX = position.x;
        let bulletY = position.y;

        let totalForce = new THREE.Vector2();

        this.planets.forEach(function(planet) {
            let distance = Math.sqrt((bulletX - planet.position.x) * (bulletX - planet.position.x) + (bulletY - planet.position.y) * (bulletY - planet.position.y));
            let forceScalar = 
                window.G * 1 * (4 * Math.pow(planet.radius, 3) * Math.PI / 3) / (distance * distance);
            let forceVector = new THREE.Vector2(planet.position.x - bulletX, planet.position.y - bulletY).normalize();
            totalForce.x += forceVector.x * forceScalar;
            totalForce.y += forceVector.y * forceScalar;
        });

        velocity.x += totalForce.x * delta;
        velocity.y += totalForce.y * delta;

        position.x += velocity.x * delta;
        position.y += velocity.y * delta;
    }

    updateBulletTraces() {
        let tracesCount = this.bulletTraces.length;
        let position = new THREE.Vector2(this.ships[this.player].position.x, this.ships[this.player].position.y);
        let velocity = new THREE.Vector2(this.game.environment.main2dbox.mousePoint.x - position.x, this.game.environment.main2dbox.mousePoint.y - position.y);
        velocity.clampLength(1, 120);
        let t = 0.2;
        let steps = 100;
        let singleStepT = t / steps;
        let hasCollided = false;

        for (let i = 0; i < tracesCount; i++) {
            this.bulletTraces[i].visible = true;
            
            if (hasCollided)
                this.bulletTraces[i].visible = false;
            else {
                for (let step = 0; step < steps; step++) {
                    this.singleStep(position, velocity, singleStepT);

                    if (this.checkCollision(position)) {
                        position.x -= velocity.x * singleStepT;
                        position.y -= velocity.y * singleStepT;
                        hasCollided = true;
                        break;
                    }
                }
            }

            this.bulletTraces[i].position.x = position.x;
            this.bulletTraces[i].position.y = position.y;
        }
    }

    processAnimations() {
        let animationFrame = this.animationFrame;

        this.bulletTraces.forEach(function(bulletTrace) {
            bulletTrace.material.color = new THREE.Color(1, (animationFrame > 30 ? 60 - animationFrame : animationFrame) / 180, (animationFrame > 30 ? 60 - animationFrame : animationFrame) / 180);
        });

        this.planets.forEach(function(planet) {
            planet.rotation.x += 0.01;
            planet.rotation.y += 0.01;
            planet.rotation.z += 0.01;
        });

        let direction = new THREE.Vector2(this.game.environment.main2dbox.mousePoint.x - this.ships[this.player].position.x, this.game.environment.main2dbox.mousePoint.y - this.ships[this.player].position.y).normalize();

        if (this.state == 0)
            this.ships[this.player].rotation.y = Math.atan2(direction.y, direction.x) + Math.PI / 2;

        if (!(this.state == 2 && this.player == 1))
            this.ships[0].rotation.z = Math.sin((animationFrame - 15) / 30 * Math.PI) / 8;
        if (!(this.state == 2 && this.player == 0))
            this.ships[1].rotation.z = Math.sin((animationFrame - 15) / 30 * Math.PI) / 8;
    }

    frame() {
        this.processAnimations();
        let t = this.game.delta / 500;
        if (this.state == 1) {
            this.singleStep(this.bullet.position, this.bullet.velocity, t);

            let collisionResult = this.checkCollision(this.bullet.position);

            switch (collisionResult) {
                case 0:
                    break;
                case 1:
                case 2:
                    this.explode(this.bullet.position.x, this.bullet.position.y);
                    this.changeState();
                    break;
                case 3:
                    this.explode(this.bullet.position.x, this.bullet.position.y);
                    this.bullet.visible = false;
                    this.state = 2;
                    this.bulletTraces.forEach(function(bulletTrace) {
                        bulletTrace.visible = false;
                    });
                    let scene = this;
                    this.deathIntervalId = setInterval(function() {
                        let point = randomSpherePoint(scene.ships[1 - scene.player].position.x, scene.ships[1 - scene.player].position.y, scene.ships[1 - scene.player].position.z, 5);
                        scene.explode(point.x, point.y);
                    }, 250);
                    break;
            }
        } else if (this.state == 0) {
            this.updateBulletTraces();
        }
        this.animationFrame++;
        this.animationFrame %= 60;
    }

    allowZoom() { return true; }
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
            this.game.environment.sceneOrtho.remove(this.scenes[this.currentSceneId].rootObjectOrtho);         
        }
        this.currentSceneId = id;
        this.scenes[this.currentSceneId].init();
        this.game.environment.scene.add(this.scenes[this.currentSceneId].rootObject); 
        this.game.environment.sceneOrtho.add(this.scenes[this.currentSceneId].rootObjectOrtho);       
    }

    getCurrentScene() {
        return this.currentSceneId == undefined ? undefined : this.scenes[this.currentSceneId];
    }
}

class Game {
    constructor() {
    }

    async init() {
        this.targetZoom = 0;
        this.zoom = 0;
        this.delta = 0;
        this.previous = undefined;
        this.environment = new Environment(this);
        this.environment.init(document.body);

        this.sceneManager = new SceneManager(this);
        this.sceneManager.addScene("main-menu", await new MainMenuScene(this).asyncPreInit());
        this.sceneManager.addScene("game", await new GameScene(this).asyncPreInit());
        this.sceneManager.setScene("main-menu");

        this.run();
    }

    run() {
        requestAnimationFrame(this.getFrameRenderFunction(this));
        let game = this;
        window.addEventListener('resize', function() {
            game.updateWindow();
        }, false);
        window.addEventListener('mousedown', function(event) {
            game.mouseDown(event);
        }, false);
        window.addEventListener('mouseup', function(event) {
            game.mouseUp(event);
        }, false);
        window.addEventListener('keydown', function(event) {
            game.keyDown(event);
        }, false);
        window.addEventListener('keyup', function(event) {
            game.keyUp(event);
        }, false);
        window.addEventListener('mousewheel', function(event) {
            let change = event.deltaY / 100;
            game.targetZoom = Math.clamp(game.targetZoom - 0.1 * change, -1, 1);
        }, false);
        this.updateWindow();
    }

    mouseDown(event) {
        this.sceneManager.getCurrentScene().mouseDown(event);
    }

    mouseUp(event) {
        this.sceneManager.getCurrentScene().mouseUp(event);
    }

    keyDown(keyInfo) {
        this.sceneManager.getCurrentScene().keyDown(keyInfo);
    }

    keyUp(keyInfo) {
        this.sceneManager.getCurrentScene().keyUp(keyInfo);
    }

    updateWindow() {
        this.environment.camera.aspect = window.innerWidth / window.innerHeight;

        let neededHeight = Math.max(window.boxHeight + 100, (window.boxWidth + 100) / this.environment.camera.aspect);
        let vFOV = THREE.Math.degToRad(this.environment.camera.fov);
        this.needZPosition = (neededHeight / 2) / Math.tan(vFOV / 2);
        this.updateCamera();
        let availableHeight = neededHeight;
        let availableWidth = availableHeight * this.environment.camera.aspect;
        this.environment.main2dbox.box.scale.x = availableWidth;
        this.environment.main2dbox.box.scale.y = availableHeight;

        this.environment.camera.updateProjectionMatrix();

        this.environment.cameraOrtho.left = 0;
        this.environment.cameraOrtho.right = window.innerWidth;
        this.environment.cameraOrtho.top = window.innerHeight;
        this.environment.cameraOrtho.bottom = 0;

        this.environment.cameraOrtho.updateProjectionMatrix();

        this.environment.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateCamera() {
        this.zoom = this.zoom + (this.targetZoom - this.zoom) / 3;
        if (!this.sceneManager.getCurrentScene().allowZoom()) {
            this.zoom = 0;
            this.targetZoom = 0;
        }
        this.environment.camera.position.z = this.needZPosition - this.zoom * (this.needZPosition - 100);
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
        this.updateCamera();
        this.environment.renderer.clear();
        this.environment.renderer.render(this.environment.scene, this.environment.camera);
        this.environment.renderer.clearDepth();
        this.environment.renderer.render(this.environment.sceneOrtho, this.environment.cameraOrtho);
        requestAnimationFrame(this.getFrameRenderFunction(this));
    }
}

window.onload = function() {
    window.game = new Game();
    game.init();
}