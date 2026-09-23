import { getBusiness } from "@/lib/business";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fail, handleError, ok } from "@/lib/api";

const allowedTypes=new Map([["application/pdf","pdf"],["image/jpeg","jpg"],["image/png","png"]]);
export async function POST(request:Request){try{const business = await getBusiness();const form=await request.formData();const file=form.get("file");if(!(file instanceof File))return fail("Select a document to upload",400);if(file.size<=0||file.size>5*1024*1024)return fail("Document must be smaller than 5 MB",422);const extension=allowedTypes.get(file.type);if(!extension)return fail("Only PDF, JPG and PNG documents are allowed",422);const fileId=`${randomUUID()}.${extension}`;const directory=path.join(process.cwd(),".data","booking-documents",String(business._id));await mkdir(directory,{recursive:true});await writeFile(path.join(directory,fileId),Buffer.from(await file.arrayBuffer()),{flag:"wx"});return ok({fileId,fileName:file.name})}catch(error){return handleError(error)}}
