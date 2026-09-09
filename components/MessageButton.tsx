'use client';
import { useState } from 'react';

export function MessageButton(){const [open,setOpen]=useState(false);const messages:string[]=[];return <div className="notification-wrap"><button type="button" className="header-icon-button" aria-label="Messages" title="Messages" onClick={()=>setOpen(!open)}>✉</button>{open&&<div className="notification-popover"><strong>Messages</strong>{messages.length?<div className="notification-list">{messages.map(item=><p key={item}>{item}</p>)}</div>:<p className="notification-empty">0 messages</p>}</div>}</div>}
