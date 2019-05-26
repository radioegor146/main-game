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
        this.box = new THREE.Mesh(new THREE.BoxGeometry(300, 200, 10), new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            opacity: 0.5,
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

    show() { 
        this.rootObject.visible = true; 
    }

    hide() { 
        this.rootObject.visible = false; 
    }

    frame() { }

    mouseDown() { }

    mouseUp() { }

    init() { }
}

class MainMenuScene extends Scene {
    constructor(game) {
        super(game);
    }

    mouseDown() {
        let newObject = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshPhongMaterial({
            color: 0x00ff00,
        }));
        newObject.position.set(this.game.environment.main2dbox.mousePoint.x, this.game.environment.main2dbox.mousePoint.y, this.game.environment.main2dbox.mousePoint.z);
        this.rootObject.add(newObject);
    }

    mouseUp() {
        let newObject = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshPhongMaterial({
            color: 0xff0000,
        }));
        newObject.position.set(this.game.environment.main2dbox.mousePoint.x, this.game.environment.main2dbox.mousePoint.y, this.game.environment.main2dbox.mousePoint.z);
        this.rootObject.add(newObject);
    }
}

class GameScene extends Scene {
    constructor(game) {
        super(game);
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
        scene.init();
        scene.hide();
        this.game.environment.scene.add(scene.rootObject);
        this.scenes[id] = scene;
    }

    setScene(id) {
        if (this.scenes[id] == undefined) 
            throw "scene " + id + " does not exist";
        for (var sceneId in this.scenes)
            this.scenes[sceneId].hide();
        this.scenes[id].show();
        this.currentSceneId = id;
    }

    getCurrentScene() {
        return this.currentSceneId == undefined ? undefined : this.scenes[this.currentSceneId];
    }
}

class Game {
    constructor() {
        this.environment = new Environment(this);
        this.environment.init(document.body);

        this.sceneManager = new SceneManager(this);
        this.sceneManager.addScene("main-menu", new MainMenuScene(this));
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
        this.updateWindow();
    }

    mouseDown() {
        this.sceneManager.getCurrentScene().mouseDown();
    }

    mouseUp() {
        this.sceneManager.getCurrentScene().mouseUp();
    }

    updateWindow() {
        this.environment.camera.aspect = window.innerWidth / window.innerHeight;

        const fitCameraToObject = function(camera, object) {
            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(object);
            const size = boundingBox.getSize();
            const neededHeight = Math.max(size.y + 20, (size.x + 20) / camera.aspect);
            const vFOV = THREE.Math.degToRad(camera.fov);
            camera.position.z = neededHeight / 2 / Math.tan(vFOV / 2);
        }

        fitCameraToObject(this.environment.camera, this.environment.main2dbox.box);

        this.environment.camera.updateProjectionMatrix();
        this.environment.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getFrameRenderFunction(game) {
        return function() {
            game.frame();
        }
    }

    frame() {
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