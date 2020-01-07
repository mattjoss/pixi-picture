/// <reference path="PictureShader.ts" />

namespace pixi_picture {
	const overlayFrag = `
varying vec2 vTextureCoord;
varying vec2 vMapCoord;
varying vec4 vColor;

uniform sampler2D uSampler[2];
uniform vec4 uColor;
%SPRITE_UNIFORMS%

void main(void)
{
    %SPRITE_CODE%
    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;
    vec4 target = texture2D(uSampler[1], vMapCoord);

    if (source.a == 0.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    //yeah, premultiplied
    vec3 Cs = source.rgb/source.a, Cb;
    if (target.a > 0.0) {
        Cb = target.rgb / target.a;
	}
    vec3 Cm = min(Cb, Cs);
	
    vec4 res;
    res.xyz = (1.0 - source.a) * Cb + source.a * Cm;
    res.a = source.a + target.a * (1.0-source.a);
    gl_FragColor = vec4(res.xyz * res.a, res.a);
}
`;

// 1 - (1-2*(Cs-0.5)) * (1-Cb) = Cs: 0.4, Cb: 0.3 = 1 - (1-2*(0.4-0.5)) * (1-0.3) = 0.16
// 1 - (1-2Cs - 1) * 1-Cb
// 1 - 2Cs * (1-Cb)


// vec3 screen = Cb + (2Cs - 1.0) - Cb * (Cs * 2.0 - 1.0) = 0.3 + (-0.2) + 0.06 = 0.16


    /**
     * @class
     * @extends PIXI.Shader
     * @memberof PIXI.extras
     * @param gl {PIXI.Shader} The WebGL shader manager this shader works for.
     * @param tilingMode {number} 0 for default, 1 for simple tiling, 2 for tiling
     */
    export class DarkenShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number) {
            super(gl, PictureShader.blendVert, overlayFrag, tilingMode);
        }
    }
}
