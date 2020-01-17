/// <reference path="PictureShader.ts" />

namespace pixi_picture {
	const vivdLightFrag = `
varying vec2 vTextureCoord;
varying vec2 vMapCoord;
varying vec4 vColor;

uniform sampler2D uSampler[2];
uniform vec4 uColor;
%SPRITE_UNIFORMS%

float flip(float v) {
  return 1.0-v;
}

float saturate(float v) {
  return clamp(v,0.0,1.0);
}

float ps(float D, float S) {
    if(S < 0.5) {
        if(S==0.0) return 0.0;
        return flip( saturate( flip(D) / (2.0*S) ) );
    } else {
        if(S==1.0) return 1.0;
        return saturate( D/(flip(2.0*(S-0.5)) ) );
    }
}

vec4 normal_blend(vec4 a, vec4 b) {

  if(a.a==0.0) {
    return b;
  }

  float alpha=a.a+b.a-a.a*b.a;
  vec3 c = (a.a*a.rgb+b.a*b.rgb*(1.0-a.a))/alpha;
  return vec4(c.r,c.g,c.b,alpha);
}



// // this is the most commonly listed formula on the web.
// // as best as i can tell, it's simply wrong.
// float pixmath(float blend, float base) {
//     if(blend>0.5) {
//         return 1.0 - saturate((1.0-base)/(2.0*(blend-0.5)));
//     } else {
//         return saturate(base/(1.0-2.0*blend));
//     }
// }
//
// // this is a formula from the obscure website:
// // http://www.simplefilter.de/en/basics/mixmods.html
// // it appears to work.
// float simpel(float A, float B) {
//     if(A <= 0.5) {
//         return 1.0 - saturate( (1.0-B)/(2.0*A) );
//     } else {
//         return saturate(B/(2.0*(1.0-A)));
//     }
// }

void main(void)
{
    %SPRITE_CODE%
    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;
    vec4 target = texture2D(uSampler[1], vMapCoord);

    if (source.a == 0.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    // unpremultiply
    vec3 Cs = source.rgb/source.a, Cb;
    if (target.a > 0.0) {
        Cb = target.rgb / target.a;
	}
	
	
    vec4 r=vec4( ps(Cs.r, Cb.r), ps(Cs.g, Cb.g), ps(Cs.b, Cb.b), source.a);
	vec4 b = vec4(Cb, target.a);
    vec4 Cm=normal_blend(r, b);




	
	
	vec4 res;
    res.xyz = (1.0 - source.a) * Cb + source.a * Cm.rgb;
    res.a = source.a + target.a * (1.0-source.a);
    gl_FragColor = vec4(res.xyz * res.a, res.a);
}
`;

    /**
     * @class
     * @extends PIXI.Shader
     * @memberof PIXI.extras
     * @param gl {PIXI.Shader} The WebGL shader manager this shader works for.
     * @param tilingMode {number} 0 for default, 1 for simple tiling, 2 for tiling
     */
    export class VividLightShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number) {
            super(gl, PictureShader.blendVert, vivdLightFrag, tilingMode);
        }
    }
}
