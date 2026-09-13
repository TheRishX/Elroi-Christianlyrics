import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
const key="songlight_ads";
const defaults={global:false, placements:{} as Record<string,boolean>, provider:"", clientId:"", slots:{} as Record<string,string>, mobileFooter:false};
async function authorized(){const store=await cookies();return validSession(store.get(cookieName)?.value);}
async function wordpressSettings(method:"GET"|"PUT", body?:unknown){const api=process.env.WORDPRESS_API_URL;if(!api)return null;const response=await fetch(`${api}/settings/ads`,{method,headers:{"Content-Type":"application/json",...(process.env.WORDPRESS_API_TOKEN?{Authorization:`Bearer ${process.env.WORDPRESS_API_TOKEN}`}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store"});if(!response.ok)throw new Error("WordPress settings unavailable");return response.json();}
export async function GET(){if(!await authorized())return NextResponse.json({error:"Unauthorized"},{status:401});try{return NextResponse.json({settings:(await wordpressSettings("GET"))||defaults});}catch{return NextResponse.json({settings:defaults});}}
export async function PUT(request:Request){if(!await authorized())return NextResponse.json({error:"Unauthorized"},{status:401});const body=await request.json().catch(()=>({}));try{return NextResponse.json({settings:(await wordpressSettings("PUT",body))||{...defaults,...body}},{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"Settings could not be saved."},{status:503});}}
