var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var pixi_picture;
(function (pixi_picture) {
    var shaderLib = [
        {
            vertUniforms: "",
            vertCode: "vTextureCoord = aTextureCoord;",
            fragUniforms: "uniform vec4 uTextureClamp;",
            fragCode: "vec2 textureCoord = clamp(vTextureCoord, uTextureClamp.xy, uTextureClamp.zw);"
        },
        {
            vertUniforms: "uniform mat3 uTransform;",
            vertCode: "vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;",
            fragUniforms: "",
            fragCode: "vec2 textureCoord = vTextureCoord;"
        },
        {
            vertUniforms: "uniform mat3 uTransform;",
            vertCode: "vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;",
            fragUniforms: "uniform mat3 uMapCoord;\nuniform vec4 uClampFrame;\nuniform vec2 uClampOffset;",
            fragCode: "vec2 textureCoord = mod(vTextureCoord - uClampOffset, vec2(1.0, 1.0)) + uClampOffset;" +
                "\ntextureCoord = (uMapCoord * vec3(textureCoord, 1.0)).xy;" +
                "\ntextureCoord = clamp(textureCoord, uClampFrame.xy, uClampFrame.zw);"
        }
    ];
    var PictureShader = (function (_super) {
        __extends(PictureShader, _super);
        function PictureShader(gl, vert, frag, tilingMode) {
            var _this = this;
            var lib = shaderLib[tilingMode];
            _this = _super.call(this, gl, vert.replace(/%SPRITE_UNIFORMS%/gi, lib.vertUniforms)
                .replace(/%SPRITE_CODE%/gi, lib.vertCode), frag.replace(/%SPRITE_UNIFORMS%/gi, lib.fragUniforms)
                .replace(/%SPRITE_CODE%/gi, lib.fragCode)) || this;
            _this.bind();
            _this.tilingMode = tilingMode;
            _this.tempQuad = new PIXI.Quad(gl);
            _this.tempQuad.initVao(_this);
            _this.uniforms.uColor = new Float32Array([1, 1, 1, 1]);
            _this.uniforms.uSampler = [0, 1];
            return _this;
        }
        PictureShader.blendVert = "\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform mat3 projectionMatrix;\nuniform mat3 mapMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    %SPRITE_CODE%\n    vMapCoord = (mapMatrix * vec3(aVertexPosition, 1.0)).xy;\n}\n";
        return PictureShader;
    }(PIXI.Shader));
    pixi_picture.PictureShader = PictureShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from https://drafts.fxtf.org/compositing/#blendingcolor\n\t// if(Cb == 1)\n\t//     B(Cb, Cs) = 1\n\t// else if(Cs == 0)\n\t//     B(Cb, Cs) = 0\n\t// else\n\t//     B(Cb, Cs) = 1 - min(1, (1 - Cb) / Cs)\n\n\tvec3 Cm;\n\n\t// Can these be combined?\n\t// red\n\tif (Cb.r == 1.0) {\n\t\tCm.r = 1.0;\n\t} else if (Cs.r == 0.0) {\n\t\tCm.r = 0.0;\n\t} else {\n\t\tCm.r = 1.0 - min(1.0, (1.0 - Cb.r) / Cs.r);\n\t}\n\n\t// green\n\tif (Cb.g == 1.0) {\n\t\tCm.g = 1.0;\n\t} else if (Cs.g == 0.0) {\n\t\tCm.g = 0.0;\n\t} else {\n\t\tCm.g = 1.0 - min(1.0, (1.0 - Cb.g) / Cs.g);\n\t}\n\n\t//blue\n\tif (Cb.b == 1.0) {\n\t\tCm.b = 1.0;\n\t} else if (Cs.b == 0.0) {\n\t\tCm.b = 0.0;\n\t} else {\n\t\tCm.b = 1.0 - min(1.0, (1.0 - Cb.b) / Cs.b);\n\t}\n\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var ColorBurnShader = (function (_super) {
        __extends(ColorBurnShader, _super);
        function ColorBurnShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return ColorBurnShader;
    }(pixi_picture.PictureShader));
    pixi_picture.ColorBurnShader = ColorBurnShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from https://drafts.fxtf.org/compositing/#blendingcolor\n\t// if(Cb == 0)\n\t//     B(Cb, Cs) = 0\n\t// else if(Cs == 1)\n\t//     B(Cb, Cs) = 1\n\t// else\n\t// \tB(Cb, Cs) = min(1.0, Cb / (1.0 - Cs))\n\n\n\tvec3 Cm;\n\n\t// Can these be combined?\n\t// red\n\tif (Cb.r == 0.0) {\n\t\tCm.r = 0.0;\n\t} else if (Cs.r == 1.0) {\n\t\tCm.r = 1.0;\n\t} else {\n\t\tCm.r = min(1.0, Cb.r / (1.0-Cs.r));\n\t}\n\n\t// green\n\tif (Cb.g == 0.0) {\n\t\tCm.g = 0.0;\n\t} else if (Cs.g == 1.0) {\n\t\tCm.g = 1.0;\n\t} else {\n\t\tCm.g = min(1.0, Cb.g / (1.0-Cs.g));\n\t}\n\n\t//blue\n\tif (Cb.b == 0.0) {\n\t\tCm.b = 0.0;\n\t} else if (Cs.b == 1.0) {\n\t\tCm.b = 1.0;\n\t} else {\n\t\tCm.b = min(1.0, Cb.b / (1.0-Cs.b));\n\t}\n\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var ColorDodgeShader = (function (_super) {
        __extends(ColorDodgeShader, _super);
        function ColorDodgeShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return ColorDodgeShader;
    }(pixi_picture.PictureShader));
    pixi_picture.ColorDodgeShader = ColorDodgeShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\n// Functions from https://drafts.fxtf.org/compositing/#blendingcolor\nfloat Lum(vec3 C) {\n\tfloat lum = 0.3 * C.r + 0.59 * C.g + 0.11 * C.b;\n\treturn lum;\n}\n\n\nvec3 ClipColor(vec3 C) {\n\tfloat L = Lum(C);\n\tfloat n = min(C.r, min(C.g, C.b));\n\tfloat x = max(C.r, max(C.g, C.b));\n\tif (n < 0.0) {\n\t\tC = L + (((C - L) * L) / (L - n));\n\t}\n\tif(x > 1.0) {\n\t\tC = L + (((C - L) * (1.0 - L)) / (x - L));\n\t}\n\treturn C;\n}\n\nvec3 SetLum(vec3 C, float l) {\n\tfloat d = l - Lum(C);\n\tC.r = C.r + d;\n\tC.g = C.g + d;\n\tC.b = C.b + d;\n\treturn ClipColor(C);\n}\n\t\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from https://drafts.fxtf.org/compositing/#blendingcolor\n\t// SetLum(Cs, Lum(Cb))\n\n\tvec3 Cm = SetLum(Cs, Lum(Cb));\n\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var ColorShader = (function (_super) {
        __extends(ColorShader, _super);
        function ColorShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return ColorShader;
    }(pixi_picture.PictureShader));
    pixi_picture.ColorShader = ColorShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n    vec3 Cm = min(Cb, Cs);\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var DarkenShader = (function (_super) {
        __extends(DarkenShader, _super);
        function DarkenShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return DarkenShader;
    }(pixi_picture.PictureShader));
    pixi_picture.DarkenShader = DarkenShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// B(Cb, Cs) = | Cb - Cs |\n\t\n\tvec3 Cm = abs(Cb - Cs);\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var DifferenceShader = (function (_super) {
        __extends(DifferenceShader, _super);
        function DifferenceShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return DifferenceShader;
    }(pixi_picture.PictureShader));
    pixi_picture.DifferenceShader = DifferenceShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    function filterManagerMixin(fm) {
        if (fm.prepareBackdrop)
            return;
        fm.pushFilter = pushFilter;
        fm.popFilter = popFilter;
        fm.syncUniforms = syncUniforms;
        fm.prepareBackdrop = prepareBackdrop;
    }
    pixi_picture.filterManagerMixin = filterManagerMixin;
    function pushFilter(target, filters) {
        var renderer = this.renderer;
        var filterData = this.filterData;
        if (!filterData) {
            filterData = this.renderer._activeRenderTarget.filterStack;
            var filterState = new FilterState();
            filterState.sourceFrame = filterState.destinationFrame = this.renderer._activeRenderTarget.size;
            filterState.renderTarget = renderer._activeRenderTarget;
            this.renderer._activeRenderTarget.filterData = filterData = {
                index: 0,
                stack: [filterState],
            };
            this.filterData = filterData;
        }
        var currentState = filterData.stack[++filterData.index];
        var renderTargetFrame = filterData.stack[0].destinationFrame;
        if (!currentState) {
            currentState = filterData.stack[filterData.index] = new FilterState();
        }
        var fullScreen = target.filterArea
            && target.filterArea.x === 0
            && target.filterArea.y === 0
            && target.filterArea.width === renderer.screen.width
            && target.filterArea.height === renderer.screen.height;
        var resolution = filters[0].resolution;
        var padding = filters[0].padding | 0;
        var targetBounds = fullScreen ? renderer.screen : (target.filterArea || target.getBounds(true));
        var sourceFrame = currentState.sourceFrame;
        var destinationFrame = currentState.destinationFrame;
        sourceFrame.x = ((targetBounds.x * resolution) | 0) / resolution;
        sourceFrame.y = ((targetBounds.y * resolution) | 0) / resolution;
        sourceFrame.width = ((targetBounds.width * resolution) | 0) / resolution;
        sourceFrame.height = ((targetBounds.height * resolution) | 0) / resolution;
        if (!fullScreen) {
            if (filterData.stack[0].renderTarget.transform) {
            }
            else if (filters[0].autoFit) {
                sourceFrame.fit(renderTargetFrame);
            }
            sourceFrame.pad(padding);
        }
        for (var i = 0; i < filters.length; i++) {
            var backdrop = null;
            if (filters[i].backdropUniformName) {
                if (backdrop === null) {
                    backdrop = this.prepareBackdrop(sourceFrame);
                }
                filters[i]._backdropRenderTarget = backdrop;
            }
        }
        destinationFrame.width = sourceFrame.width;
        destinationFrame.height = sourceFrame.height;
        var renderTarget = this.getPotRenderTarget(renderer.gl, sourceFrame.width, sourceFrame.height, resolution);
        currentState.target = target;
        currentState.filters = filters;
        currentState.resolution = resolution;
        currentState.renderTarget = renderTarget;
        renderTarget.setFrame(destinationFrame, sourceFrame);
        renderer.bindRenderTarget(renderTarget);
        renderTarget.clear(filters[filters.length - 1].clearColor);
    }
    function popFilter() {
        var filterData = this.filterData;
        var lastState = filterData.stack[filterData.index - 1];
        var currentState = filterData.stack[filterData.index];
        this.quad.map(currentState.renderTarget.size, currentState.sourceFrame).upload();
        var filters = currentState.filters;
        if (filters.length === 1) {
            filters[0].apply(this, currentState.renderTarget, lastState.renderTarget, false, currentState);
            this.freePotRenderTarget(currentState.renderTarget);
        }
        else {
            var flip = currentState.renderTarget;
            var flop = this.getPotRenderTarget(this.renderer.gl, currentState.sourceFrame.width, currentState.sourceFrame.height, currentState.resolution);
            flop.setFrame(currentState.destinationFrame, currentState.sourceFrame);
            flop.clear();
            var i = 0;
            for (i = 0; i < filters.length - 1; ++i) {
                filters[i].apply(this, flip, flop, true, currentState);
                var t = flip;
                flip = flop;
                flop = t;
            }
            filters[i].apply(this, flip, lastState.renderTarget, false, currentState);
            this.freePotRenderTarget(flip);
            this.freePotRenderTarget(flop);
        }
        currentState.clear();
        var backdropFree = false;
        for (var i = 0; i < filters.length; i++) {
            if (filters[i]._backdropRenderTarget) {
                if (!backdropFree) {
                    this.freePotRenderTarget(filters[i]._backdropRenderTarget);
                    backdropFree = true;
                }
                filters[i]._backdropRenderTarget = null;
            }
        }
        filterData.index--;
        if (filterData.index === 0) {
            this.filterData = null;
        }
    }
    function syncUniforms(shader, filter) {
        var renderer = this.renderer;
        var gl = renderer.gl;
        var uniformData = filter.uniformData;
        var uniforms = filter.uniforms;
        var textureCount = 1;
        var currentState;
        if (shader.uniforms.filterArea) {
            currentState = this.filterData.stack[this.filterData.index];
            var filterArea = shader.uniforms.filterArea;
            filterArea[0] = currentState.renderTarget.size.width;
            filterArea[1] = currentState.renderTarget.size.height;
            filterArea[2] = currentState.sourceFrame.x;
            filterArea[3] = currentState.sourceFrame.y;
            shader.uniforms.filterArea = filterArea;
        }
        if (shader.uniforms.filterClamp) {
            currentState = currentState || this.filterData.stack[this.filterData.index];
            var filterClamp = shader.uniforms.filterClamp;
            filterClamp[0] = 0;
            filterClamp[1] = 0;
            filterClamp[2] = (currentState.sourceFrame.width - 1) / currentState.renderTarget.size.width;
            filterClamp[3] = (currentState.sourceFrame.height - 1) / currentState.renderTarget.size.height;
            shader.uniforms.filterClamp = filterClamp;
        }
        for (var i in uniformData) {
            if (!shader.uniforms.data[i]) {
                continue;
            }
            if (i === filter.backdropUniformName) {
                var rt = filter._backdropRenderTarget;
                shader.uniforms[i] = textureCount;
                renderer.boundTextures[textureCount] = renderer.emptyTextures[textureCount];
                gl.activeTexture(gl.TEXTURE0 + textureCount);
                gl.bindTexture(gl.TEXTURE_2D, rt.texture.texture);
                textureCount++;
                continue;
            }
            var type = uniformData[i].type;
            if (type === 'sampler2d' && uniforms[i] !== 0) {
                if (uniforms[i].baseTexture) {
                    shader.uniforms[i] = this.renderer.bindTexture(uniforms[i].baseTexture, textureCount);
                }
                else {
                    shader.uniforms[i] = textureCount;
                    var gl_1 = this.renderer.gl;
                    renderer.boundTextures[textureCount] = renderer.emptyTextures[textureCount];
                    gl_1.activeTexture(gl_1.TEXTURE0 + textureCount);
                    uniforms[i].texture.bind();
                }
                textureCount++;
            }
            else if (type === 'mat3') {
                if (uniforms[i].a !== undefined) {
                    shader.uniforms[i] = uniforms[i].toArray(true);
                }
                else {
                    shader.uniforms[i] = uniforms[i];
                }
            }
            else if (type === 'vec2') {
                if (uniforms[i].x !== undefined) {
                    var val = shader.uniforms[i] || new Float32Array(2);
                    val[0] = uniforms[i].x;
                    val[1] = uniforms[i].y;
                    shader.uniforms[i] = val;
                }
                else {
                    shader.uniforms[i] = uniforms[i];
                }
            }
            else if (type === 'float') {
                if (shader.uniforms.data[i].value !== uniformData[i]) {
                    shader.uniforms[i] = uniforms[i];
                }
            }
            else {
                shader.uniforms[i] = uniforms[i];
            }
        }
    }
    function prepareBackdrop(bounds) {
        var renderer = this.renderer;
        var renderTarget = renderer._activeRenderTarget;
        if (renderTarget.root) {
            return null;
        }
        var resolution = renderTarget.resolution;
        var fr = renderTarget.sourceFrame || renderTarget.destinationFrame;
        bounds.fit(fr);
        var x = (bounds.x - fr.x) * resolution;
        var y = (bounds.y - fr.y) * resolution;
        var w = (bounds.width) * resolution;
        var h = (bounds.height) * resolution;
        var gl = renderer.gl;
        var rt = this.getPotRenderTarget(gl, w, h, 1);
        renderer.boundTextures[1] = renderer.emptyTextures[1];
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, rt.texture.texture);
        if (!rt.rebound) {
            renderer._activeRenderTarget = null;
            renderer.bindRenderTarget(renderTarget);
            rt.rebound = true;
        }
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, x, y, w, h);
        return rt;
    }
    var FilterState = (function () {
        function FilterState() {
            this.renderTarget = null;
            this.target = null;
            this.resolution = 1;
            this.sourceFrame = new PIXI.Rectangle();
            this.destinationFrame = new PIXI.Rectangle();
            this.filters = [];
        }
        FilterState.prototype.clear = function () {
            this.filters = null;
            this.target = null;
            this.renderTarget = null;
        };
        return FilterState;
    }());
    var BackdropFilter = (function (_super) {
        __extends(BackdropFilter, _super);
        function BackdropFilter() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.backdropUniformName = null;
            _this._backdropRenderTarget = null;
            _this.clearColor = null;
            return _this;
        }
        return BackdropFilter;
    }(PIXI.Filter));
    pixi_picture.BackdropFilter = BackdropFilter;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cb = source.rgb/source.a, Cs;\n    if (target.a > 0.0) {\n        Cs = target.rgb / target.a;\n    }\n    vec3 multiply = Cb * Cs * 2.0;\n    vec3 Cs2 = Cs * 2.0 - 1.0;\n    vec3 screen = Cb + Cs2 - Cb * Cs2;\n    vec3 B;\n    if (Cb.r <= 0.5) {\n        B.r = multiply.r;\n    } else {\n        B.r = screen.r;\n    }\n    if (Cb.g <= 0.5) {\n        B.g = multiply.g;\n    } else {\n        B.g = screen.g;\n    }\n    if (Cb.b <= 0.5) {\n        B.b = multiply.b;\n    } else {\n        B.b = screen.b;\n    }\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cs + source.a * B;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var HardLightShader = (function (_super) {
        __extends(HardLightShader, _super);
        function HardLightShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return HardLightShader;
    }(pixi_picture.PictureShader));
    pixi_picture.HardLightShader = HardLightShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\n// Functions from https://drafts.fxtf.org/compositing/#blendingcolor\nfloat Lum(vec3 C) {\n\tfloat lum = 0.3 * C.r + 0.59 * C.g + 0.11 * C.b;\n\treturn lum;\n}\n\n\nvec3 ClipColor(vec3 C) {\n\tfloat L = Lum(C);\n\tfloat n = min(C.r, min(C.g, C.b));\n\tfloat x = max(C.r, max(C.g, C.b));\n\tif (n < 0.0) {\n\t\tC = L + (((C - L) * L) / (L - n));\n\t}\n\tif(x > 1.0) {\n\t\tC = L + (((C - L) * (1.0 - L)) / (x - L));\n\t}\n\treturn C;\n}\n\nvec3 SetLum(vec3 C, float l) {\n\tfloat d = l - Lum(C);\n\tC.r = C.r + d;\n\tC.g = C.g + d;\n\tC.b = C.b + d;\n\treturn ClipColor(C);\n}\n\nfloat Sat(vec3 C) {\n\treturn (max(C.r, max(C.g, C.b)) - min(C.r, min(C.g, C.b)));\n}\n\n// Find middle number of 3 numbers\nfloat middleOfThree(float a, float b, float c)\n{\n    if (a > b)\n    {\n\t\tif (b > c) {\n            return b;\n\t\t} else if (a > c) {\n            return c;\n\t\t} else {\n            return a;\n\t\t}\n    }\n    else\n    {\n\t\tif (a > c) {\n            return a;\n\t\t} else if (b > c) {\n            return c;\n\t\t} else {\n            return b;\n\t\t}\n    }\n}\n\nvec3 SetSat(vec3 C, float s) {\n\tfloat Cmax = max(C.r, max(C.g, C.b));\n\tfloat Cmin = min(C.r, min(C.g, C.b));\n\tfloat Cmid = middleOfThree(C.r, C.g, C.b);\n\n\tint minIndex, midIndex, maxIndex;\n\n\tif (Cmax > Cmin) {\n\t\tCmid = (((Cmid - Cmin) * s) / (Cmax - Cmin));\n\t\tCmax = s;\n\t} else {\n\t\tCmid = Cmax = 0.0;\n\t}\n\tCmin = 0.0;\n\n\tif (C.r < C.g) {\n\t\tif (C.r < C.b) {\n\t\t\tC.r = Cmin;\n\t\t\tif (C.g > C.b) {\n\t\t\t\tC.g = Cmax;\n\t\t\t\tC.b = Cmid;\n\t\t\t} else {\n\t\t\t\tC.g = Cmid;\n\t\t\t\tC.b = Cmax;\n\t\t\t}\n\t\t} else {\n\t\t\tC.r = Cmid;\n\t\t\tif (C.g < C.b) {\n\t\t\t\tC.g = Cmin;\n\t\t\t\tC.b = Cmax;\n\t\t\t} else {\n\t\t\t\tC.g = Cmax;\n\t\t\t\tC.b = Cmin;\n\t\t\t}\n\t\t}\n\t} else {\n\t\tif (C.r < C.b) {\n\t\t\tC.r = Cmid;\n\t\t\tC.g = Cmin;\n\t\t\tC.b = Cmax;\n\t\t} else {\n\t\t\tif (C.g > C.b) {\n\t\t\t\tC.g = Cmid;\n\t\t\t\tC.b = Cmin;\n\t\t\t} else {\n\t\t\t\tC.g = Cmin;\n\t\t\t\tC.b = Cmid;\n\t\t\t}\n\t\t\tC.r = Cmax;\n\t\t}\n\t}\n\n\treturn C;\n}\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from https://drafts.fxtf.org/compositing/#blendingcolor\n\t// B(Cb, Cs) = SetLum(SetSat(Cs, Sat(Cb)), Lum(Cb))\n\n\tvec3 Cm = SetLum(SetSat(Cs, Sat(Cb)), Lum(Cb));\n\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var HueShader = (function (_super) {
        __extends(HueShader, _super);
        function HueShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return HueShader;
    }(pixi_picture.PictureShader));
    pixi_picture.HueShader = HueShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\tvec3 Cm = max(Cb, Cs);\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var LightenShader = (function (_super) {
        __extends(LightenShader, _super);
        function LightenShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return LightenShader;
    }(pixi_picture.PictureShader));
    pixi_picture.LightenShader = LightenShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from here http://www.simplefilter.de/en/basics/mixmods.html\n\t// C = A + B - 1\n\tvec3 Cm = Cs + Cb - 1.0;\n\t\n\t\n\tvec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var LinearBurnShader = (function (_super) {
        __extends(LinearBurnShader, _super);
        function LinearBurnShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return LinearBurnShader;
    }(pixi_picture.PictureShader));
    pixi_picture.LinearBurnShader = LinearBurnShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from here http://www.simplefilter.de/en/basics/mixmods.html\n\t// C = A + B\n\tvec3 Cm = Cs + Cb;\n\t\n\t\n\tvec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var LinearDodgeShader = (function (_super) {
        __extends(LinearDodgeShader, _super);
        function LinearDodgeShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return LinearDodgeShader;
    }(pixi_picture.PictureShader));
    pixi_picture.LinearDodgeShader = LinearDodgeShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from here http://www.simplefilter.de/en/basics/mixmods.html\n\t// C = B + 2*A - 1\n\tvec3 Cm = Cb + 2.0 * Cs - 1.0;\n\t\n\t\n\tvec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var LinearLightShader = (function (_super) {
        __extends(LinearLightShader, _super);
        function LinearLightShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return LinearLightShader;
    }(pixi_picture.PictureShader));
    pixi_picture.LinearLightShader = LinearLightShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\n// Functions from https://drafts.fxtf.org/compositing/#blendingcolor\nfloat Lum(vec3 C) {\n\tfloat lum = 0.3 * C.r + 0.59 * C.g + 0.11 * C.b;\n\treturn lum;\n}\n\n\nvec3 ClipColor(vec3 C) {\n\tfloat L = Lum(C);\n\tfloat n = min(C.r, min(C.g, C.b));\n\tfloat x = max(C.r, max(C.g, C.b));\n\tif (n < 0.0) {\n\t\tC = L + (((C - L) * L) / (L - n));\n\t}\n\tif(x > 1.0) {\n\t\tC = L + (((C - L) * (1.0 - L)) / (x - L));\n\t}\n\treturn C;\n}\n\nvec3 SetLum(vec3 C, float l) {\n\tfloat d = l - Lum(C);\n\tC.r = C.r + d;\n\tC.g = C.g + d;\n\tC.b = C.b + d;\n\treturn ClipColor(C);\n}\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from https://drafts.fxtf.org/compositing/#blendingcolor\n\t// SetLum(Cb, Lum(Cs))\n\n\tvec3 Cm = SetLum(Cb, Lum(Cs));\n\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var LuminosityShader = (function (_super) {
        __extends(LuminosityShader, _super);
        function LuminosityShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return LuminosityShader;
    }(pixi_picture.PictureShader));
    pixi_picture.LuminosityShader = LuminosityShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    function mapFilterBlendModesToPixi(gl, array) {
        if (array === void 0) { array = []; }
        PIXI.BLEND_MODES.LINEAR_DODGE = 20;
        PIXI.BLEND_MODES.LINEAR_BURN = 21;
        PIXI.BLEND_MODES.LINEAR_LIGHT = 22;
        PIXI.BLEND_MODES.VIVID_LIGHT = 23;
        array[PIXI.BLEND_MODES.OVERLAY] = [new pixi_picture.OverlayShader(gl, 0), new pixi_picture.OverlayShader(gl, 1), new pixi_picture.OverlayShader(gl, 2)];
        array[PIXI.BLEND_MODES.HARD_LIGHT] = [new pixi_picture.HardLightShader(gl, 0), new pixi_picture.HardLightShader(gl, 1), new pixi_picture.HardLightShader(gl, 2)];
        array[PIXI.BLEND_MODES.SOFT_LIGHT] = [new pixi_picture.SoftLightShader(gl, 0), new pixi_picture.SoftLightShader(gl, 1), new pixi_picture.SoftLightShader(gl, 2)];
        array[PIXI.BLEND_MODES.DARKEN] = [new pixi_picture.DarkenShader(gl, 0), new pixi_picture.DarkenShader(gl, 1), new pixi_picture.DarkenShader(gl, 2)];
        array[PIXI.BLEND_MODES.LIGHTEN] = [new pixi_picture.LightenShader(gl, 0), new pixi_picture.LightenShader(gl, 1), new pixi_picture.LightenShader(gl, 2)];
        array[PIXI.BLEND_MODES.COLOR_DODGE] = [new pixi_picture.ColorDodgeShader(gl, 0), new pixi_picture.ColorDodgeShader(gl, 1), new pixi_picture.ColorDodgeShader(gl, 2)];
        array[PIXI.BLEND_MODES.COLOR_BURN] = [new pixi_picture.ColorBurnShader(gl, 0), new pixi_picture.ColorBurnShader(gl, 1), new pixi_picture.ColorBurnShader(gl, 2)];
        array[PIXI.BLEND_MODES.COLOR] = [new pixi_picture.ColorShader(gl, 0), new pixi_picture.ColorBurnShader(gl, 1), new pixi_picture.ColorBurnShader(gl, 2)];
        array[PIXI.BLEND_MODES.LUMINOSITY] = [new pixi_picture.LuminosityShader(gl, 0), new pixi_picture.LuminosityShader(gl, 1), new pixi_picture.LuminosityShader(gl, 2)];
        array[PIXI.BLEND_MODES.LINEAR_DODGE] = [new pixi_picture.LinearDodgeShader(gl, 0), new pixi_picture.LinearDodgeShader(gl, 1), new pixi_picture.LinearDodgeShader(gl, 2)];
        array[PIXI.BLEND_MODES.LINEAR_BURN] = [new pixi_picture.LinearBurnShader(gl, 0), new pixi_picture.LinearBurnShader(gl, 1), new pixi_picture.LinearBurnShader(gl, 2)];
        array[PIXI.BLEND_MODES.LINEAR_LIGHT] = [new pixi_picture.LinearLightShader(gl, 0), new pixi_picture.LinearLightShader(gl, 1), new pixi_picture.LinearLightShader(gl, 2)];
        array[PIXI.BLEND_MODES.HUE] = [new pixi_picture.HueShader(gl, 0), new pixi_picture.HueShader(gl, 1), new pixi_picture.HueShader(gl, 2)];
        array[PIXI.BLEND_MODES.SATURATION] = [new pixi_picture.SaturationShader(gl, 0), new pixi_picture.SaturationShader(gl, 1), new pixi_picture.SaturationShader(gl, 2)];
        array[PIXI.BLEND_MODES.DIFFERENCE] = [new pixi_picture.DifferenceShader(gl, 0), new pixi_picture.DifferenceShader(gl, 1), new pixi_picture.DifferenceShader(gl, 2)];
        array[PIXI.BLEND_MODES.VIVID_LIGHT] = [new pixi_picture.VividLightShader(gl, 0), new pixi_picture.VividLightShader(gl, 1), new pixi_picture.VividLightShader(gl, 2)];
        return array;
    }
    pixi_picture.mapFilterBlendModesToPixi = mapFilterBlendModesToPixi;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var normalFrag = "\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n\n    vec4 sample = texture2D(uSampler[0], textureCoord);\n    gl_FragColor = sample * uColor;\n}\n";
    var normalVert = "\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    %SPRITE_CODE%\n}\n";
    var NormalShader = (function (_super) {
        __extends(NormalShader, _super);
        function NormalShader(gl, tilingMode) {
            return _super.call(this, gl, normalVert, normalFrag, tilingMode) || this;
        }
        return NormalShader;
    }(pixi_picture.PictureShader));
    pixi_picture.NormalShader = NormalShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cb = source.rgb/source.a, Cs;\n    if (target.a > 0.0) {\n        Cs = target.rgb / target.a;\n    }\n    vec3 multiply = Cb * Cs * 2.0;\n    vec3 Cb2 = Cb * 2.0 - 1.0;\n    vec3 screen = Cb2 + Cs - Cb2 * Cs;\n    vec3 B;\n    if (Cs.r <= 0.5) {\n        B.r = multiply.r;\n    } else {\n        B.r = screen.r;\n    }\n    if (Cs.g <= 0.5) {\n        B.g = multiply.g;\n    } else {\n        B.g = screen.g;\n    }\n    if (Cs.b <= 0.5) {\n        B.b = multiply.b;\n    } else {\n        B.b = screen.b;\n    }\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cs + source.a * B;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var OverlayShader = (function (_super) {
        __extends(OverlayShader, _super);
        function OverlayShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return OverlayShader;
    }(pixi_picture.PictureShader));
    pixi_picture.OverlayShader = OverlayShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var WRAP_MODES = PIXI.WRAP_MODES;
    function nextPow2(v) {
        v += (v === 0) ? 1 : 0;
        --v;
        v |= v >>> 1;
        v |= v >>> 2;
        v |= v >>> 4;
        v |= v >>> 8;
        v |= v >>> 16;
        return v + 1;
    }
    var PictureRenderer = (function (_super) {
        __extends(PictureRenderer, _super);
        function PictureRenderer(renderer) {
            return _super.call(this, renderer) || this;
        }
        PictureRenderer.prototype.onContextChange = function () {
            pixi_picture.filterManagerMixin(this.renderer.filterManager);
            var gl = this.renderer.gl;
            this.drawModes = pixi_picture.mapFilterBlendModesToPixi(gl);
            this.normalShader = [new pixi_picture.NormalShader(gl, 0), new pixi_picture.NormalShader(gl, 1), new pixi_picture.NormalShader(gl, 2)];
            this._tempClamp = new Float32Array(4);
            this._tempColor = new Float32Array(4);
            this._tempRect = new PIXI.Rectangle();
            this._tempRect2 = new PIXI.Rectangle();
            this._tempRect3 = new PIXI.Rectangle();
            this._tempMatrix = new PIXI.Matrix();
            this._tempMatrix2 = new PIXI.Matrix();
            this._bigBuf = new Uint8Array(1 << 20);
            this._renderTexture = new PIXI.BaseRenderTexture(1024, 1024);
        };
        PictureRenderer.prototype.start = function () {
        };
        PictureRenderer.prototype.flush = function () {
        };
        PictureRenderer.prototype._getRenderTexture = function (minWidth, minHeight) {
            if (this._renderTexture.width < minWidth ||
                this._renderTexture.height < minHeight) {
                minWidth = nextPow2(minWidth);
                minHeight = nextPow2(minHeight);
                this._renderTexture.resize(minWidth, minHeight);
            }
            return this._renderTexture;
        };
        PictureRenderer.prototype._getBuf = function (size) {
            var buf = this._bigBuf;
            if (buf.length < size) {
                size = nextPow2(size);
                buf = new Uint8Array(size);
                this._bigBuf = buf;
            }
            return buf;
        };
        PictureRenderer.prototype.render = function (sprite) {
            if (!sprite.texture.valid) {
                return;
            }
            var tilingMode = 0;
            if (sprite.tileTransform) {
                tilingMode = this._isSimpleSprite(sprite) ? 1 : 2;
            }
            var blendShader = this.drawModes[sprite.blendMode];
            if (blendShader) {
                this._renderBlend(sprite, blendShader[tilingMode]);
            }
            else {
                this._renderNormal(sprite, this.normalShader[tilingMode]);
            }
        };
        PictureRenderer.prototype._renderNormal = function (sprite, shader) {
            var renderer = this.renderer;
            renderer.bindShader(shader);
            renderer.state.setBlendMode(sprite.blendMode);
            this._renderInner(sprite, shader);
        };
        PictureRenderer.prototype._renderBlend = function (sprite, shader) {
            var renderer = this.renderer;
            var spriteBounds = sprite.getBounds();
            var renderTarget = renderer._activeRenderTarget;
            var matrix = renderTarget.projectionMatrix;
            var flipX = matrix.a < 0;
            var flipY = matrix.d < 0;
            var resolution = renderTarget.resolution;
            var screen = this._tempRect;
            var fr = renderTarget.sourceFrame || renderTarget.destinationFrame;
            screen.x = 0;
            screen.y = 0;
            screen.width = fr.width;
            screen.height = fr.height;
            var bounds = this._tempRect2;
            var fbw = fr.width * resolution, fbh = fr.height * resolution;
            bounds.x = (spriteBounds.x + matrix.tx / matrix.a) * resolution + fbw / 2;
            bounds.y = (spriteBounds.y + matrix.ty / matrix.d) * resolution + fbh / 2;
            bounds.width = spriteBounds.width * resolution;
            bounds.height = spriteBounds.height * resolution;
            if (flipX) {
                bounds.y = fbw - bounds.width - bounds.x;
            }
            if (flipY) {
                bounds.y = fbh - bounds.height - bounds.y;
            }
            var screenBounds = this._tempRect3;
            var x_1 = Math.floor(Math.max(screen.x, bounds.x));
            var x_2 = Math.ceil(Math.min(screen.x + screen.width, bounds.x + bounds.width));
            var y_1 = Math.floor(Math.max(screen.y, bounds.y));
            var y_2 = Math.ceil(Math.min(screen.y + screen.height, bounds.y + bounds.height));
            var pixelsWidth = x_2 - x_1;
            var pixelsHeight = y_2 - y_1;
            if (pixelsWidth <= 0 || pixelsHeight <= 0) {
                return;
            }
            var rt = this._getRenderTexture(pixelsWidth, pixelsHeight);
            renderer.bindTexture(rt, 1, true);
            var gl = renderer.gl;
            if (renderer.renderingToScreen && renderTarget.root) {
                var buf = this._getBuf(pixelsWidth * pixelsHeight * 4);
                gl.readPixels(x_1, y_1, pixelsWidth, pixelsHeight, gl.RGBA, gl.UNSIGNED_BYTE, this._bigBuf);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, pixelsWidth, pixelsHeight, gl.RGBA, gl.UNSIGNED_BYTE, this._bigBuf);
            }
            else {
                gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, x_1, y_1, pixelsWidth, pixelsHeight);
            }
            renderer.bindShader(shader);
            renderer.state.setBlendMode(PIXI.BLEND_MODES.NORMAL);
            if (shader.uniforms.mapMatrix) {
                var mapMatrix = this._tempMatrix;
                mapMatrix.a = bounds.width / rt.width / spriteBounds.width;
                if (flipX) {
                    mapMatrix.a = -mapMatrix.a;
                    mapMatrix.tx = (bounds.x - x_1) / rt.width - (spriteBounds.x + spriteBounds.width) * mapMatrix.a;
                }
                else {
                    mapMatrix.tx = (bounds.x - x_1) / rt.width - spriteBounds.x * mapMatrix.a;
                }
                mapMatrix.d = bounds.height / rt.height / spriteBounds.height;
                if (flipY) {
                    mapMatrix.d = -mapMatrix.d;
                    mapMatrix.ty = (bounds.y - y_1) / rt.height - (spriteBounds.y + spriteBounds.height) * mapMatrix.d;
                }
                else {
                    mapMatrix.ty = (bounds.y - y_1) / rt.height - spriteBounds.y * mapMatrix.d;
                }
                shader.uniforms.mapMatrix = mapMatrix.toArray(true);
            }
            this._renderInner(sprite, shader);
        };
        PictureRenderer.prototype._renderInner = function (sprite, shader) {
            var renderer = this.renderer;
            if (shader.tilingMode > 0) {
                this._renderWithShader(sprite, shader.tilingMode === 1, shader);
            }
            else {
                this._renderSprite(sprite, shader);
            }
        };
        PictureRenderer.prototype._renderWithShader = function (ts, isSimple, shader) {
            var quad = shader.tempQuad;
            var renderer = this.renderer;
            renderer.bindVao(quad.vao);
            var vertices = quad.vertices;
            var _width = ts._width;
            var _height = ts._height;
            var _anchorX = ts._anchor._x;
            var _anchorY = ts._anchor._y;
            var w0 = _width * (1 - _anchorX);
            var w1 = _width * -_anchorX;
            var h0 = _height * (1 - _anchorY);
            var h1 = _height * -_anchorY;
            var wt = ts.transform.worldTransform;
            var a = wt.a;
            var b = wt.b;
            var c = wt.c;
            var d = wt.d;
            var tx = wt.tx;
            var ty = wt.ty;
            vertices[0] = (a * w1) + (c * h1) + tx;
            vertices[1] = (d * h1) + (b * w1) + ty;
            vertices[2] = (a * w0) + (c * h1) + tx;
            vertices[3] = (d * h1) + (b * w0) + ty;
            vertices[4] = (a * w0) + (c * h0) + tx;
            vertices[5] = (d * h0) + (b * w0) + ty;
            vertices[6] = (a * w1) + (c * h0) + tx;
            vertices[7] = (d * h0) + (b * w1) + ty;
            vertices = quad.uvs;
            vertices[0] = vertices[6] = -ts.anchor.x;
            vertices[1] = vertices[3] = -ts.anchor.y;
            vertices[2] = vertices[4] = 1.0 - ts.anchor.x;
            vertices[5] = vertices[7] = 1.0 - ts.anchor.y;
            quad.upload();
            var tex = ts._texture;
            var lt = ts.tileTransform.localTransform;
            var uv = ts.uvTransform;
            var mapCoord = uv.mapCoord;
            var uClampFrame = uv.uClampFrame;
            var uClampOffset = uv.uClampOffset;
            var w = tex.width;
            var h = tex.height;
            var W = _width;
            var H = _height;
            var tempMat = this._tempMatrix2;
            tempMat.set(lt.a * w / W, lt.b * w / H, lt.c * h / W, lt.d * h / H, lt.tx / W, lt.ty / H);
            tempMat.invert();
            if (isSimple) {
                tempMat.append(mapCoord);
            }
            else {
                shader.uniforms.uMapCoord = mapCoord.toArray(true);
                shader.uniforms.uClampFrame = uClampFrame;
                shader.uniforms.uClampOffset = uClampOffset;
            }
            shader.uniforms.uTransform = tempMat.toArray(true);
            var color = this._tempColor;
            var alpha = ts.worldAlpha;
            PIXI.utils.hex2rgb(ts.tint, color);
            color[0] *= alpha;
            color[1] *= alpha;
            color[2] *= alpha;
            color[3] = alpha;
            shader.uniforms.uColor = color;
            renderer.bindTexture(tex, 0, true);
            quad.vao.draw(this.renderer.gl.TRIANGLES, 6, 0);
        };
        PictureRenderer.prototype._renderSprite = function (sprite, shader) {
            var renderer = this.renderer;
            var quad = shader.tempQuad;
            renderer.bindVao(quad.vao);
            var uvs = sprite.texture._uvs;
            var vertices = quad.vertices;
            var vd = sprite.vertexData;
            for (var i = 0; i < 8; i++) {
                quad.vertices[i] = vd[i];
            }
            quad.uvs[0] = uvs.x0;
            quad.uvs[1] = uvs.y0;
            quad.uvs[2] = uvs.x1;
            quad.uvs[3] = uvs.y1;
            quad.uvs[4] = uvs.x2;
            quad.uvs[5] = uvs.y2;
            quad.uvs[6] = uvs.x3;
            quad.uvs[7] = uvs.y3;
            quad.upload();
            var frame = sprite.texture.frame;
            var base = sprite.texture.baseTexture;
            var clamp = this._tempClamp;
            var eps = 0.5 / base.resolution;
            clamp[0] = (frame.x + eps) / base.width;
            clamp[1] = (frame.y + eps) / base.height;
            clamp[2] = (frame.x + frame.width - eps) / base.width;
            clamp[3] = (frame.y + frame.height - eps) / base.height;
            shader.uniforms.uTextureClamp = clamp;
            var color = this._tempColor;
            PIXI.utils.hex2rgb(sprite.tint, color);
            var alpha = sprite.worldAlpha;
            color[0] *= alpha;
            color[1] *= alpha;
            color[2] *= alpha;
            color[3] = alpha;
            shader.uniforms.uColor = color;
            renderer.bindTexture(base, 0, true);
            quad.vao.draw(this.renderer.gl.TRIANGLES, 6, 0);
        };
        PictureRenderer.prototype._isSimpleSprite = function (ts) {
            var renderer = this.renderer;
            var tex = ts._texture;
            var baseTex = tex.baseTexture;
            var isSimple = baseTex.isPowerOfTwo && tex.frame.width === baseTex.width && tex.frame.height === baseTex.height;
            if (isSimple) {
                if (!baseTex._glTextures[renderer.CONTEXT_UID]) {
                    if (baseTex.wrapMode === WRAP_MODES.CLAMP) {
                        baseTex.wrapMode = WRAP_MODES.REPEAT;
                    }
                }
                else {
                    isSimple = baseTex.wrapMode !== WRAP_MODES.CLAMP;
                }
            }
            return isSimple;
        };
        return PictureRenderer;
    }(PIXI.ObjectRenderer));
    pixi_picture.PictureRenderer = PictureRenderer;
    PIXI.WebGLRenderer.registerPlugin('picture', PictureRenderer);
    PIXI.CanvasRenderer.registerPlugin('picture', PIXI.CanvasSpriteRenderer);
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var overlayFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\n// Functions from https://drafts.fxtf.org/compositing/#blendingcolor\nfloat Lum(vec3 C) {\n\tfloat lum = 0.3 * C.r + 0.59 * C.g + 0.11 * C.b;\n\treturn lum;\n}\n\n\nvec3 ClipColor(vec3 C) {\n\tfloat L = Lum(C);\n\tfloat n = min(C.r, min(C.g, C.b));\n\tfloat x = max(C.r, max(C.g, C.b));\n\tif (n < 0.0) {\n\t\tC = L + (((C - L) * L) / (L - n));\n\t}\n\tif(x > 1.0) {\n\t\tC = L + (((C - L) * (1.0 - L)) / (x - L));\n\t}\n\treturn C;\n}\n\nvec3 SetLum(vec3 C, float l) {\n\tfloat d = l - Lum(C);\n\tC.r = C.r + d;\n\tC.g = C.g + d;\n\tC.b = C.b + d;\n\treturn ClipColor(C);\n}\n\nfloat Sat(vec3 C) {\n\treturn (max(C.r, max(C.g, C.b)) - min(C.r, min(C.g, C.b)));\n}\n\n// Find middle number of 3 numbers\nfloat middleOfThree(float a, float b, float c)\n{\n    if (a > b)\n    {\n\t\tif (b > c) {\n            return b;\n\t\t} else if (a > c) {\n            return c;\n\t\t} else {\n            return a;\n\t\t}\n    }\n    else\n    {\n\t\tif (a > c) {\n            return a;\n\t\t} else if (b > c) {\n            return c;\n\t\t} else {\n            return b;\n\t\t}\n    }\n}\n\nvec3 SetSat(vec3 C, float s) {\n\tfloat Cmax = max(C.r, max(C.g, C.b));\n\tfloat Cmin = min(C.r, min(C.g, C.b));\n\tfloat Cmid = middleOfThree(C.r, C.g, C.b);\n\n\tint minIndex, midIndex, maxIndex;\n\n\tif (Cmax > Cmin) {\n\t\tCmid = (((Cmid - Cmin) * s) / (Cmax - Cmin));\n\t\tCmax = s;\n\t} else {\n\t\tCmid = Cmax = 0.0;\n\t}\n\tCmin = 0.0;\n\n\tif (C.r < C.g) {\n\t\tif (C.r < C.b) {\n\t\t\tC.r = Cmin;\n\t\t\tif (C.g > C.b) {\n\t\t\t\tC.g = Cmax;\n\t\t\t\tC.b = Cmid;\n\t\t\t} else {\n\t\t\t\tC.g = Cmid;\n\t\t\t\tC.b = Cmax;\n\t\t\t}\n\t\t} else {\n\t\t\tC.r = Cmid;\n\t\t\tif (C.g < C.b) {\n\t\t\t\tC.g = Cmin;\n\t\t\t\tC.b = Cmax;\n\t\t\t} else {\n\t\t\t\tC.g = Cmax;\n\t\t\t\tC.b = Cmin;\n\t\t\t}\n\t\t}\n\t} else {\n\t\tif (C.r < C.b) {\n\t\t\tC.r = Cmid;\n\t\t\tC.g = Cmin;\n\t\t\tC.b = Cmax;\n\t\t} else {\n\t\t\tif (C.g > C.b) {\n\t\t\t\tC.g = Cmid;\n\t\t\t\tC.b = Cmin;\n\t\t\t} else {\n\t\t\t\tC.g = Cmin;\n\t\t\t\tC.b = Cmid;\n\t\t\t}\n\t\t\tC.r = Cmax;\n\t\t}\n\t}\n\n\treturn C;\n}\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    //reverse hardlight\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    //yeah, premultiplied\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t// Formula from https://drafts.fxtf.org/compositing/#blendingcolor\n\t// B(Cb, Cs) = SetLum(SetSat(Cb, Sat(Cs)), Lum(Cb))\n\n\tvec3 Cm = SetLum(SetSat(Cb, Sat(Cs)), Lum(Cb));\n\n\t\n    vec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var SaturationShader = (function (_super) {
        __extends(SaturationShader, _super);
        function SaturationShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, overlayFrag, tilingMode) || this;
        }
        return SaturationShader;
    }(pixi_picture.PictureShader));
    pixi_picture.SaturationShader = SaturationShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var softLightFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n \nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n    \n    vec3 first = Cb - (1.0 - 2.0 * Cs) * Cb * (1.0 - Cb);\n\n    vec3 B;\n    vec3 D;\n    if (Cs.r <= 0.5)\n    {\n        B.r = first.r;\n    }\n    else\n    {\n        if (Cb.r <= 0.25)\n        {\n            D.r = ((16.0 * Cb.r - 12.0) * Cb.r + 4.0) * Cb.r;    \n        }\n        else\n        {\n            D.r = sqrt(Cb.r);\n        }\n        B.r = Cb.r + (2.0 * Cs.r - 1.0) * (D.r - Cb.r);\n    }\n    if (Cs.g <= 0.5)\n    {\n        B.g = first.g;\n    }\n    else\n    {\n        if (Cb.g <= 0.25)\n        {\n            D.g = ((16.0 * Cb.g - 12.0) * Cb.g + 4.0) * Cb.g;    \n        }\n        else\n        {\n            D.g = sqrt(Cb.g);\n        }\n        B.g = Cb.g + (2.0 * Cs.g - 1.0) * (D.g - Cb.g);\n    }\n    if (Cs.b <= 0.5)\n    {\n        B.b = first.b;\n    }\n    else\n    {\n        if (Cb.b <= 0.25)\n        {\n            D.b = ((16.0 * Cb.b - 12.0) * Cb.b + 4.0) * Cb.b;    \n        }\n        else\n        {\n            D.b = sqrt(Cb.b);\n        }\n        B.b = Cb.b + (2.0 * Cs.b - 1.0) * (D.b - Cb.b);\n    }   \n\n    vec4 res;\n\n    res.xyz = (1.0 - source.a) * Cb + source.a * B;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var SoftLightShader = (function (_super) {
        __extends(SoftLightShader, _super);
        function SoftLightShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, softLightFrag, tilingMode) || this;
        }
        return SoftLightShader;
    }(pixi_picture.PictureShader));
    pixi_picture.SoftLightShader = SoftLightShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var Sprite = (function (_super) {
        __extends(Sprite, _super);
        function Sprite(texture) {
            var _this = _super.call(this, texture) || this;
            _this.pluginName = 'picture';
            return _this;
        }
        return Sprite;
    }(PIXI.Sprite));
    pixi_picture.Sprite = Sprite;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var TilingSprite = (function (_super) {
        __extends(TilingSprite, _super);
        function TilingSprite(texture) {
            var _this = _super.call(this, texture) || this;
            _this.pluginName = 'picture';
            return _this;
        }
        return TilingSprite;
    }(PIXI.extras.TilingSprite));
    pixi_picture.TilingSprite = TilingSprite;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    var vivdLightFrag = "\nvarying vec2 vTextureCoord;\nvarying vec2 vMapCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler[2];\nuniform vec4 uColor;\n%SPRITE_UNIFORMS%\n\nfloat flip(float v) {\n  return 1.0-v;\n}\n\nfloat saturate(float v) {\n  return clamp(v,0.0,1.0);\n}\n\nfloat ps(float D, float S) {\n    if(S < 0.5) {\n        if(S==0.0) return 0.0;\n        return flip( saturate( flip(D) / (2.0*S) ) );\n    } else {\n        if(S==1.0) return 1.0;\n        return saturate( D/(flip(2.0*(S-0.5)) ) );\n    }\n}\n\nvec4 normal_blend(vec4 a, vec4 b) {\n\n  if(a.a==0.0) {\n    return b;\n  }\n\n  float alpha=a.a+b.a-a.a*b.a;\n  vec3 c = (a.a*a.rgb+b.a*b.rgb*(1.0-a.a))/alpha;\n  return vec4(c.r,c.g,c.b,alpha);\n}\n\n\n\n// // this is the most commonly listed formula on the web.\n// // as best as i can tell, it's simply wrong.\n// float pixmath(float blend, float base) {\n//     if(blend>0.5) {\n//         return 1.0 - saturate((1.0-base)/(2.0*(blend-0.5)));\n//     } else {\n//         return saturate(base/(1.0-2.0*blend));\n//     }\n// }\n//\n// // this is a formula from the obscure website:\n// // http://www.simplefilter.de/en/basics/mixmods.html\n// // it appears to work.\n// float simpel(float A, float B) {\n//     if(A <= 0.5) {\n//         return 1.0 - saturate( (1.0-B)/(2.0*A) );\n//     } else {\n//         return saturate(B/(2.0*(1.0-A)));\n//     }\n// }\n\nvoid main(void)\n{\n    %SPRITE_CODE%\n    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;\n    vec4 target = texture2D(uSampler[1], vMapCoord);\n\n    if (source.a == 0.0) {\n        gl_FragColor = vec4(0, 0, 0, 0);\n        return;\n    }\n    // unpremultiply\n    vec3 Cs = source.rgb/source.a, Cb;\n    if (target.a > 0.0) {\n        Cb = target.rgb / target.a;\n\t}\n\t\n\t\n    vec4 r=vec4( ps(Cb.r, Cs.r), ps(Cb.g, Cs.g), ps(Cb.b, Cs.b), source.a);\n\tvec4 b = vec4(Cs, target.a);\n    vec4 Cm=normal_blend(r, b);\n\n\n\n\n\t\n\t\n\tvec4 res;\n    res.xyz = (1.0 - source.a) * Cb + source.a * Cm.rgb;\n    res.a = source.a + target.a * (1.0-source.a);\n    gl_FragColor = vec4(res.xyz * res.a, res.a);\n}\n";
    var VividLightShader = (function (_super) {
        __extends(VividLightShader, _super);
        function VividLightShader(gl, tilingMode) {
            return _super.call(this, gl, pixi_picture.PictureShader.blendVert, vivdLightFrag, tilingMode) || this;
        }
        return VividLightShader;
    }(pixi_picture.PictureShader));
    pixi_picture.VividLightShader = VividLightShader;
})(pixi_picture || (pixi_picture = {}));
var pixi_picture;
(function (pixi_picture) {
    PIXI.picture = pixi_picture;
})(pixi_picture || (pixi_picture = {}));
//# sourceMappingURL=pixi-picture.js.map