import type {JSONContent} from '@tiptap/react';
export type Project={id:string;title:string;description:string;goal:number;created_at:string;updated_at:string};
export type Book={id:string;title:string;project_id:string;position:number};
export type Chapter={id:string;title:string;book_id:string;position:number};
export type Scene={id:string;chapter_id:string;title:string;content:JSONContent;plain_text:string;version:number;position:number};
export type Revision={id:string;content:JSONContent;plain_text:string;version:number;created_at:string};
export type Note={id:string;title:string;body:string};
export type Entity={id:string;name:string;kind:string;description:string;background:string;goals:string};
export type PlotEvent={id:string;title:string;body:string;stage:string;story_date:string;position:number};
