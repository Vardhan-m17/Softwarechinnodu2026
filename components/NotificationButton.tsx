'use client';
import { useState } from 'react';

export function NotificationButton(){const [open,setOpen]=useState(false);const notifications:string[]=[];return <div className="notification-wrap"><button type="button" className="header-icon-button" aria-label="Notifications" title="Notifications" onClick={()=>setOpen(!open)}>🔔</button>{open&&<div className="notification-popover"><strong>Notifications</strong>{notifications.length?<div className="notification-list">{notifications.map(item=><p key={item}>{item}</p>)}</div>:<p className="notification-empty">0 notifications</p>}</div>}</div>}
