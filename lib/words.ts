export function countWords(text:string){return text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length||0;}
export function plainDocument(text:string){return {type:'doc',content:text.split(/\r?\n/).map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}))};}
