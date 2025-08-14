/* constellation.js
   Three.js звёздный фон с инстансингом и шейдерным мерцанием,
   суперскопления, LOD и мобильная оптимизация */

   class StarryBackground {
    constructor(config = {}) {
      // ==== НАСТРОЙКИ ЗВЕЗДНОГО ФОНА ====
      // superCount   — количество крупных скоплений звёзд
      // minorCount   — количество мелких скоплений звёзд
      // superWeight  — относительная плотность крупных скоплений
      // minorWeight  — относительная плотность мелких скоплений
      // superRadius  — радиус крупных скоплений
      // minorRadius  — радиус мелких скоплений
      // baseSpread   — разброс точек при генерации кластеров
      // baseStars    — базовое число звёзд (умножается на LOD и countFactor)
      const {
        superCount  = 3,
        minorCount  = 8,
        superWeight = 0.02,
        minorWeight = 0.055,
        superRadius = 100,
        minorRadius = 200,
        baseSpread  = 1450,
        baseStars   = 7000
      } = config;
      // ==================================
  
      if (!this._checkWebGL()) return;
  
      // сцена и камера
      this.scene  = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
      this.camera.position.z = 50;
  
      // определяем мобильность
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
                        .test(navigator.userAgent);
  
      // LOD на основе ядер CPU
      const threads  = navigator.hardwareConcurrency || 4;
      const baseLOD  = Math.min(1, threads / 4);
      this.lodFactor = this.isMobile ? baseLOD * 0.5 : baseLOD;
  
      // мобильные множители
      this.countFactor = this.isMobile ? 1.5 : 1;
      this.sizeFactor  = this.isMobile ? 1.5 : 1;
  
      // готовим кластеры (использует superCount, minorCount, superWeight, minorWeight)
      this._initClusters({
        superCount, minorCount, superWeight, minorWeight,
        superRadius, minorRadius, baseSpread
      });
  
      // инициализация рендерера и DOM
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !this.isMobile });
      this._initRenderer();
  
      // шейдерные материалы для звёзд
      this._initShader();
  
      // создаём инстансы звёзд
      this._buildInstancedStars(baseStars);
  
      // запускаем анимацию
      this.clock = new THREE.Clock();
      window.addEventListener('resize', () => this._onResize());
      this._animate();
    }
  
    _checkWebGL() {
      try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (c.getContext('webgl') || c.getContext('experimental-webgl')));
      } catch {
        console.warn('WebGL не поддерживается');
        return false;
      }
    }
  
    _initClusters({ superCount, minorCount, superWeight, minorWeight, superRadius, minorRadius, baseSpread }) {
      const superC = this._randPoints(superCount, baseSpread);
      const minorC = this._randPoints(minorCount, baseSpread);
      this.clusters = [];
  
      superC.forEach(c => this.clusters.push({ center: c, radius: superRadius, weight: superWeight }));
      minorC.forEach(c => this.clusters.push({ center: c, radius: minorRadius, weight: minorWeight }));
  
      const totalWeight = superCount * superWeight + minorCount * minorWeight;
      this.bgWeight = Math.max(0, 1 - totalWeight);
    }
  
    _randPoints(n, spread) {
      const arr = [];
      for (let i = 0; i < n; i++) {
        arr.push(new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(spread),
          THREE.MathUtils.randFloatSpread(spread),
          THREE.MathUtils.randFloatSpread(spread)
        ));
      }
      return arr;
    }
  
    _initRenderer() {
      const DPR = Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2);
      this.renderer.setPixelRatio(DPR);
      this.renderer.setSize(innerWidth, Math.max(innerHeight, document.documentElement.scrollHeight));
      Object.assign(this.renderer.domElement.style, {
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: -1
      });
      (document.getElementById('universe-container') || document.body)
        .appendChild(this.renderer.domElement);
      window.addEventListener('scroll', () => this._onScroll());
    }
  
    _onScroll() {
      const height = Math.max(innerHeight, document.documentElement.scrollHeight);
      if (this.renderer.domElement.height !== height) {
        this.renderer.setSize(innerWidth, height);
      }
    }
  
    _initShader() {
      // создаём текстуру точки
      const size = 64, c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      grad.addColorStop(0, 'white');
      grad.addColorStop(.15, 'white');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
      ctx.fill();
      this.pointTex = new THREE.CanvasTexture(c);
      this.pointTex.minFilter = THREE.LinearMipMapLinearFilter;
      this.pointTex.magFilter = THREE.LinearFilter;
  
      // шейдерный материал
      this.starMaterial = new THREE.RawShaderMaterial({
        uniforms: {
          uTime:    { value: 0 },
          uSize:    { value: 4 * this.sizeFactor },
          pointTex: { value: this.pointTex }
        },
        vertexShader: `
          precision highp float;
          attribute vec3 offset, color;
          attribute float phase, twinkle;
          uniform mat4 modelViewMatrix, projectionMatrix;
          uniform float uTime, uSize;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(offset, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * (300.0 / -mv.z);
            vColor = color;
            vAlpha = twinkle > 0.5
              ? 0.8 + 0.2 * sin(uTime * 2.0 + phase)
              : 0.85;
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform sampler2D pointTex;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float m = texture2D(pointTex, gl_PointCoord).a;
            gl_FragColor = vec4(vColor, vAlpha * m);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
    }
  
    _buildInstancedStars(baseStars) {
      const total = Math.floor(baseStars * this.lodFactor * this.countFactor);
  
      const offsets  = new Float32Array(total * 3);
      const colors   = new Float32Array(total * 3);
      const phases   = new Float32Array(total);
      const twinkles = new Float32Array(total);
  
      for (let i = 0; i < total; i++) {
        const r = Math.random();
        let pos;
        if (r < this.bgWeight) {
          pos = new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(1000),
            THREE.MathUtils.randFloatSpread(1000),
            THREE.MathUtils.randFloatSpread(1000)
          );
          twinkles[i] = 0;
        } else {
          let acc, cinfo;
          acc = this.bgWeight;
          for (const c of this.clusters) {
            acc += c.weight;
            if (r < acc) { cinfo = c; break; }
          }
          pos = cinfo.center.clone().add(new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(cinfo.radius),
            THREE.MathUtils.randFloatSpread(cinfo.radius),
            THREE.MathUtils.randFloatSpread(cinfo.radius)
          ));
          twinkles[i] = 1;
        }
        offsets.set([pos.x, pos.y, pos.z], i * 3);
        const col = new THREE.Color(this._pickColor());
        colors.set([col.r, col.g, col.b], i * 3);
        phases[i] = Math.random() * Math.PI * 2;
      }
  
      const geometry = new THREE.InstancedBufferGeometry();
      geometry.setAttribute('position',  new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
      geometry.setAttribute('offset',    new THREE.InstancedBufferAttribute(offsets, 3));
      geometry.setAttribute('color',     new THREE.InstancedBufferAttribute(colors, 3));
      geometry.setAttribute('phase',     new THREE.InstancedBufferAttribute(phases, 1));
      geometry.setAttribute('twinkle',   new THREE.InstancedBufferAttribute(twinkles, 1));
      geometry.instanceCount = total;
  
      this.stars = new THREE.Points(geometry, this.starMaterial);
      this.scene.add(this.stars);
    }
  
    _pickColor() {
      const r = Math.random();
      if (r < 0.03) return 0x9bbcff;
      if (r < 0.10) return 0xcad7ff;
      if (r < 0.20) return 0xfefbda;
      if (r < 0.35) return 0xffe6b5;
      return 0xffc8c8;
    }
  
    _onResize() {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      const DPR = Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2);
      this.renderer.setPixelRatio(DPR);
      this.renderer.setSize(innerWidth, Math.max(innerHeight, document.documentElement.scrollHeight));
    }
  
    _animate() {
      requestAnimationFrame(() => this._animate());
      if (!document.hidden) {
        const dt = this.clock.getDelta();
        const t  = this.clock.getElapsedTime();
        this.starMaterial.uniforms.uTime.value = t;
        // скорость вращения: мобильная / десктоп
        this.stars.rotation.y += this.isMobile ? dt * 0.02 : dt * 0.06;
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
  
  // Инициализация после загрузки страницы
  window.addEventListener('DOMContentLoaded', () => {
    new StarryBackground({
      superCount: 3,
      minorCount: 8,
      superWeight: 0.02,
      minorWeight: 0.055,
      superRadius: 100,
      minorRadius: 200,
      baseSpread: 1450,
      baseStars: 7000
    });
  });
  