/// <reference types="pixi.js" />
declare namespace pixi_picture {
    class PictureShader extends PIXI.Shader {
        tempQuad: PIXI.Quad;
        tilingMode: number;
        static blendVert: string;
        constructor(gl: WebGLRenderingContext, vert: string, frag: string, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class ColorBurnShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class ColorDodgeShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class ColorShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class DarkenShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class DifferenceShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    function filterManagerMixin(fm: PIXI.FilterManager): void;
    class BackdropFilter<T> extends PIXI.Filter<T> {
        backdropUniformName: string;
        _backdropRenderTarget: PIXI.RenderTarget;
        clearColor: Float32Array;
        uniformData: PIXI.UniformDataMap<T>;
    }
}
declare namespace pixi_picture {
    class HardLightShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class HueShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class LightenShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class LinearBurnShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class LinearDodgeShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class LinearLightShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class LuminosityShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    function mapFilterBlendModesToPixi(gl: WebGLRenderingContext, array?: Array<Array<PictureShader>>): Array<Array<PictureShader>>;
}
declare namespace pixi_picture {
    class NormalShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class OverlayShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    import Sprite = PIXI.Sprite;
    import TilingSprite = PIXI.extras.TilingSprite;
    class PictureRenderer extends PIXI.ObjectRenderer {
        constructor(renderer: PIXI.WebGLRenderer);
        drawModes: Array<Array<PictureShader>>;
        normalShader: Array<PictureShader>;
        _tempClamp: Float32Array;
        _tempColor: Float32Array;
        _tempRect: PIXI.Rectangle;
        _tempRect2: PIXI.Rectangle;
        _tempRect3: PIXI.Rectangle;
        _tempMatrix: PIXI.Matrix;
        _tempMatrix2: PIXI.Matrix;
        _bigBuf: Uint8Array;
        _renderTexture: PIXI.BaseRenderTexture;
        onContextChange(): void;
        start(): void;
        flush(): void;
        _getRenderTexture(minWidth: number, minHeight: number): PIXI.BaseRenderTexture;
        _getBuf(size: number): Float32Array;
        render(sprite: Sprite): void;
        _renderNormal(sprite: Sprite, shader: PictureShader): void;
        _renderBlend(sprite: Sprite, shader: PictureShader): void;
        _renderInner(sprite: Sprite, shader: PictureShader): void;
        _renderWithShader(ts: TilingSprite, isSimple: boolean, shader: PictureShader): void;
        _renderSprite(sprite: Sprite, shader: PictureShader): void;
        _isSimpleSprite(ts: Sprite): boolean;
    }
}
declare namespace pixi_picture {
    class SaturationShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class SoftLightShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
    class Sprite extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
    }
}
declare namespace pixi_picture {
    class TilingSprite extends PIXI.extras.TilingSprite {
        constructor(texture: PIXI.Texture);
    }
}
declare namespace pixi_picture {
    class VividLightShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number);
    }
}
declare namespace pixi_picture {
}
