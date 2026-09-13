"use client";
import {useEffect,useState} from "react";
import {Icon} from "./Icon";
export function BookmarkButton({slug}:{slug:string}){
 const [saved,setSaved]=useState(false);
 const [error,setError]=useState("");
 function read():string[]{try{const list=JSON.parse(localStorage.getItem("songlight-bookmarks")||"[]");return Array.isArray(list)?list.filter(x=>typeof x==="string"):[]}catch{return []}}
 useEffect(()=>{setSaved(read().includes(slug))},[slug]);
 function toggle(){try{const list=read();const next=list.includes(slug)?list.filter(x=>x!==slug):[...list,slug];localStorage.setItem("songlight-bookmarks",JSON.stringify(next));setSaved(next.includes(slug));setError("")}catch{setError("Saving is unavailable in this browser.")}}
 return <><button className={`icon-button ${saved?"saved":""}`} onClick={toggle} aria-pressed={saved} aria-label={saved?"Remove bookmark":"Bookmark song"}><Icon name="bookmark" size={18} style={saved?{fill:"currentColor"}:undefined}/></button><span className="sr-only" role="status">{error||(saved?"Song saved":"")}</span></>;
}
