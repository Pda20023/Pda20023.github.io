const firebaseConfig = {
    apiKey: "AIzaSyD8i1okfrbGFd97AdrRbQp-arR0W2LwbBA",
    authDomain: "dpda-vr.firebaseapp.com",
    databaseURL: "https://dpda-vr-default-rtdb.firebaseio.com/",
    projectId: "dpda-vr",
    storageBucket: "dpda-vr.firebasestorage.app",
    messagingSenderId: "531649853607",
    appId: "1:531649853607:web:f6ec9e34d4c2e6a4fa8382"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

AFRAME.registerComponent('multisync', {
    init: function () {
        this.camera = document.querySelector('a-camera');
        this.scene = document.getElementById('s1');
        this.remotePlayers = {};
        this.localId = Math.random().toString(36).substr(2, 6);
        this.playerRef = db.ref('players/' + this.localId);
        this.playerRef.onDisconnect().remove();

        window.addEventListener('beforeunload', () => { this.playerRef.remove(); });

        db.ref('players').on('value', snapshot => {
            const data = snapshot.val();
            if (!data) return;

            Object.keys(data).forEach(id => {
                if (id === this.localId) return;
                if (!this.remotePlayers[id]) {
                    const playerAvatar = document.createElement('a-entity');
                    playerAvatar.setAttribute('gltf-model', '#witch');
                    playerAvatar.setAttribute('scale', '5 5 5');
                    playerAvatar.setAttribute('position', '0 0 0');
                    playerAvatar.setAttribute('rotation', '0 180 0');
                    this.scene.appendChild(playerAvatar);
                    this.remotePlayers[id] = playerAvatar;
                }
                const pos = data[id];
                this.remotePlayers[id].setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
                this.remotePlayers[id].setAttribute('rotation', `${pos.rx} ${pos.ry + 180} ${pos.rz}`);
            });
            Object.keys(this.remotePlayers).forEach(id => {
                if (!data[id]) {
                    this.scene.removeChild(this.remotePlayers[id]);
                    delete this.remotePlayers[id];
                }
            });
        });
        this.worldPos = new THREE.Vector3();
    },
    tick: function (time, timeDelta) {
        if (!this.lastSync) this.lastSync = 0;
        if (time - this.lastSync > 100) {
            this.camera.object3D.getWorldPosition(this.worldPos);
            const rot = this.camera.getAttribute('rotation');
            this.playerRef.set({ x: this.worldPos.x, y: this.worldPos.y, z: this.worldPos.z, rx: rot.x, ry: rot.y, rz: rot.z });
            this.lastSync = time;
        }
    }
});