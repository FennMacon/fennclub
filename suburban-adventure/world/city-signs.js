import * as THREE from 'three';
import {storeSignStyle} from './city-layout.js';

const hash=text=>[...text].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
export const createStoreSignFactory=()=>{
    const cache=new Map();
    return name=>{
        if(cache.has(name))return cache.get(name).clone(true);
        const group=new THREE.Group(),style=storeSignStyle(name),seed=hash(name);
        group.name='AbstractStoreSign:'+name;group.userData.signStyle=style;group.userData.mount=seed%3===0?'blade':'wall';
        const colors=[0xffb897,0x99ddd4,0xd9a9e9,0xc6d98d,0xe8cc83],color=colors[seed%colors.length];
        const vertices=[];
        const line=(a,b)=>vertices.push(...a,...b);
        const poly=points=>points.slice(1).forEach((p,i)=>line(points[i],p));
        const circle=(x,y,r,stretch=1)=>poly(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return [x+Math.cos(a)*r,y+Math.sin(a)*r*stretch,0];}));
        const box=(x,y,s)=>poly([[x-s,y-s,0],[x+s,y-s,0],[x+s,y+s,0],[x-s,y+s,0],[x-s,y-s,0]]);
        switch(style){
            case 'orbit':circle(0,0,1.15);circle(0,0,.3);circle(0,0,1.6,.38);line([-1.5,-.8,0],[1.5,.8,0]);break;
            case 'steam':poly([[-1.3,0,0],[-.8,-.7,0],[.8,-.7,0],[1.3,0,0],[-1.3,0,0]]);for(const x of [-.65,0,.65])poly([[x,.3,0],[x-.2,.7,0],[x+.15,1.1,0],[x,1.5,0]]);break;
            case 'cup':poly([[-1,.7,0],[-.8,-.7,0],[.7,-.7,0],[.9,.7,0],[-1,.7,0]]);circle(1,.1,.5);poly([[-.4,1,0],[-.65,1.4,0],[-.25,1.8,0]]);line([-1.3,-1,0],[1.3,-1,0]);break;
            case 'fan':for(let i=0;i<5;i++)poly([[-1.1+i*.4,1.2-Math.abs(i-2)*.25,0],[0,-.8,0],[1.1-i*.2,.7+i*.1,0]]);break;
            case 'pixel':for(const [x,y] of [[-1,1],[0,1],[1,0],[0,-1],[-1,-1]])box(x*.6,y*.6,.28);line([-1.4,0,0],[1.4,0,0]);break;
            case 'hanger':poly([[0,.6,0],[-1.5,-.5,0],[1.5,-.5,0],[0,.6,0],[0,1,0],[.4,1.35,0],[.1,1.6,0],[-.2,1.4,0]]);break;
            case 'spark':circle(0,0,.55);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;line([Math.cos(a)*.8,Math.sin(a)*.8,0],[Math.cos(a)*1.6,Math.sin(a)*1.6,0]);}break;
            case 'bolt':poly([[.5,1.6,0],[-.8,.1,0],[.3,.1,0],[-.5,-1.5,0],[1,-.1,0],[0,-.1,0]]);circle(0,0,1.6,.65);break;
            default:poly([[-1.4,.6,0],[-.5,-.8,0],[.4,.9,0],[1.4,-.4,0],[-1.4,.6,0]]);for(const [x,y] of [[-1.4,.6],[-.5,-.8],[.4,.9],[1.4,-.4]])circle(x,y,.18);
        }
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        const glyph=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color,fog:true}));glyph.scale.set(.9+(seed%4)*.12,.9+((seed>>>4)%4)*.1,1);glyph.rotation.z=((seed%9)-4)*.035;group.add(glyph);
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
        ctx.clearRect(0,0,512,128);ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.font=`${seed%2?'italic':'bold'} ${name.length>18?29:36}px ${seed%3?'monospace':'Georgia'}`;
        ctx.translate(256,64);ctx.rotate(((seed%7)-3)*.015);ctx.fillText(name.toUpperCase(),0,0,490);
        const label=new THREE.Mesh(new THREE.PlaneGeometry(5.8,1.45),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,alphaTest:.08,depthWrite:false,side:THREE.FrontSide,fog:true}));
        label.position.set(0,-2,.03);group.add(label);const reverse=label.clone();reverse.position.z=-.03;reverse.rotation.y=Math.PI;group.add(reverse);cache.set(name,group);return group.clone(true);
    };
};
