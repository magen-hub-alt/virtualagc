#!/usr/bin/env python3
"""Bundle exact source excerpts plus assembler-derived address maps. No generated source is masqueraded as historical."""
from pathlib import Path
import re,json,hashlib,html,gzip
ROOT=Path(__file__).resolve().parents[1];UP=ROOT.parent
SHA='c9d3953778030af9f49aa74f88b2bbd9a9387053'
BASE=f'https://github.com/virtualagc/virtualagc/blob/{SHA}/'
CM='Manche72R3';LM='LM131R1'
routines=[]
def routine(id,title,program,file,start,end,input,operation,output,effect,kind='related'):
 path=f'{program}/{file}' if file else None
 lines=(UP/path).read_text().splitlines() if path else []
 if file: assert 1<=start<=end<=len(lines),(id,start,end,len(lines))
 routines.append(dict(id=id,title=title,program=program,path=path,start=start,end=end,code=lines[start-1:end],input=input,operation=operation,output=output,effect=effect,kind=kind,url=BASE+path+f'#L{start}-L{end}' if path else None))
routine('p11-clock','P11 · start the mission clock',CM,'P11.agc',140,177,'Liftoff discrete / backup Verb 75','Preserve liftoff time, zero the onboard elapsed-time counters and protect the sequence against restart.','TIME2, TLIFTOFF, TEPHEM','The spacecraft gets a common time reference for navigation and scheduled work. This does not ignite the F-1 engines.')
routine('p11-monitor','P11 · monitor the climb',CM,'P11.agc',190,213,'Inertial platform and accelerometers','Initialize the acceleration-reading service, schedule attitude-error display and change the major mode to 11.','PREREAD1, ATERTASK, major mode 11','The crew can compare spacecraft navigation against the launch vehicle. Saturn’s LVDC controls nominal steering.')
routine('servicer','SERVICER · integrate acceleration',CM,'SERVICER207.agc',448,478,'PIPA accelerometer increments + state estimate','Accumulate velocity change and run the average-gravity/state update.','DVTOTAL, RN, VN','Navigation estimates the changing velocity and position; this is sensing and computation, not a direct thruster command.')
routine('coast','ORBITAL INTEGRATION · predict the coast',CM,'ORBITAL_INTEGRATION.agc',19,43,'Position, velocity, elapsed time and gravity model','The integration package propagates a state vector between observations.','Predicted position and velocity','Coasting motion is gravity-driven. This source documents a navigation capability, not an engine command.')
routine('tli-monitor','P47 · measure velocity change',CM,'P40-P47.agc',358,384,'Accelerometer readings from the spacecraft IMU','Check IMU status and initialize the delta-V monitoring sequence.','Measured delta-V display','A spacecraft monitoring capability relevant to external thrust. It does not establish that this exact source range was executing at the selected mission instant.')
routine('target','P30 · prepare the maneuver',CM,'P30,P37.agc',104,132,'Crew/ground target: ignition time and desired delta-V','Select external delta-V targeting, accept the maneuver data and prepare calculations.','Target quantities for powered flight','A requested change in velocity is translated into the inputs that a burn program needs.')
routine('cm-burn','P40CSM · configure an SPS burn',CM,'P40-P47.agc',28,55,'Ignition target, spacecraft mass and steering mode','Set the steering law and thrust model, preserve ignition time, and prepare the spacecraft maneuver.','CSTEER, F, NOMTIG','The Service Propulsion System can execute the prepared maneuver with the spacecraft’s digital autopilot.')
routine('cm-steer','S40.8 · steer toward the target',CM,'P40-P47.agc',1602,1627,'Velocity-to-go and measured velocity change','Update the powered-flight steering solution.','Steering quantities / velocity-to-go','The guidance loop reduces the velocity error while the engine changes the trajectory. This animation illustrates the causal role.')
routine('attitude','R60CSM · request an attitude maneuver',CM,'R60,R62.agc',19,49,'Requested vehicle attitude and IMU orientation','Prepare and dispatch the attitude maneuver routine.','Attitude-maneuver state','Orient the spacecraft for docking, observation or thrust. A DAP translates attitude errors into actuator requests.')
routine('rcs','RCSATT · attitude feedback',CM,'RCS-CSM_DIGITAL_AUTOPILOT.agc',41,66,'Gimbal angles, target attitude and rate errors','Run the reaction-control digital autopilot through its interrupt-driven cycle.','RCS control state','Small thruster impulses turn the CSM. Translational docking commands also involve the crew’s hand controller.')
routine('accident','Physical failure · no AGC trigger',CM,None,0,0,'Oxygen-tank hardware failure','Tank rupture and oxygen loss damage the power/life-support system.','Electrical and oxygen emergency','There is no authentic AGC source line to show for causing this accident. Crew and ground teams develop the abort response.','hardware')
routine('lm-start','DOFSTART · initialize Aquarius',LM,'FRESH_START_AND_RESTART.agc',53,78,'Computer start or fresh-start request','Begin a protected fresh start and put engine-control outputs in a safe state.','Initialized guidance-computer state','The LGC becomes available as a navigation and control computer. The crew must still power and configure the LM systems.')
routine('cm-start','Fresh start / restart · restore Odyssey',CM,'FRESH_START_AND_RESTART.agc',20,46,'Computer power and startup conditions','The source describes initialization of flags, mode state and the executive idle loop.','A running CMC','A computer restart is one part of the crew’s larger command-module power-up procedure. These comments describe capability, not a recorded boot trace.')
routine('lm-align','P52 · align the inertial reference',LM,'P51-P53.agc',129,155,'Alignment option and reference matrix','Select the reference orientation used by the alignment routine.','REFSMMAT / IMU alignment state','Guidance needs a trusted orientation before a burn. Actual Apollo 13 alignment procedures combined crew observations and ground instructions.')
routine('lm-target','P30 · enter the rescue target',LM,'P30,P37.agc',51,75,'Time of ignition and local-vertical delta-V components','Display the ignition time and delta-V, then set external delta-V targeting.','TIG, target velocity change, XDELVFLG','The ground-computed rescue maneuver becomes a target for Aquarius’s burn program.')
routine('lm-burn','P40LM · prepare the descent engine',LM,'P40-P47.agc',95,138,'DPS maneuver target, docked configuration and IMU state','Choose the P40 ignition table, check the IMU, load DPS constants and prepare the thrust attitude.','WHICH, F, VEX, thrust direction','Aquarius uses the descent engine while docked to Odyssey. This is a propulsion maneuver, not a lunar descent.')
routine('ignition','IGNITION · issue engine-on',LM,'BURN,_BABY,_BURN_--_MASTER_IGNITION_ROUTINE.agc',383,402,'Ignition timing + astronaut engine-enable response','Check the crew-response flag and write the engine-on request to the discrete-output channel.','ENGONFLG + DSALMOUT','This is the real software/hardware boundary: a channel write requests engine ignition when the hardware and crew configuration permit it.')
routine('lm-steer','S40.8 · close the velocity gap',LM,'P40-P47.agc',888,913,'Previous velocity-to-go and measured delta-V','Subtract delivered velocity, transform the result, and compute remaining burn time.','VG, VGDISP, TGO','The direction and remaining duration of thrust follow the evolving velocity error. The shown vectors are educational representations.')
routine('cutoff','ENGINOF3 · stop thrust',LM,'P40-P47.agc',452,473,'Burn completion / engine-off request','Clear the engine-on flag, issue the engine-off channel word and zero automatic throttle.','DSALMOUT, THRUST, CHAN14','A software output removes thrust demand. Real valves, engine dynamics and crew switches are outside the CPU.')
routine('lm-nav','SERVICER · Aquarius navigation',LM,'SERVICER.agc',161,187,'Accelerometer samples and saved state','Schedule protected state-vector processing and navigation updates.','LM navigation state','A source-level navigation capability. During low-power coast, operating modes and powered equipment depend on crew procedures.')
routine('manual','Manual control · the crew closes the loop',LM,None,0,0,'Earth-in-window reference, crew timing and hand controls','The crew holds attitude and starts/stops the correction according to the procedure.','Manually commanded thrust','No source range is presented as an autonomous controller for this action. Linked computer routines elsewhere are capabilities, not proof they steered this manual burn.','manual')
routine('lm-monitor','P47 · delta-V monitor capability',LM,'P40-P47.agc',340,365,'IMU status and accelerometer increments','Initialize a velocity-change monitoring program.','Measured delta-V / display','This is an available software capability, not a claim that P47 ran during the historical 105-hour manually timed correction.')
routine('lm-rcs','Q/R RCS autopilot · small attitude impulses',LM,'Q,R-AXES_RCS_AUTOPILOT.agc',20,46,'Angular errors and rates','The Q/R-axis autopilot computes and schedules reaction-control activity.','RCS jet requests','LM reaction-control jets provide small impulses. The final trim was a crew-directed maneuver; the map is not an instruction trace.')
routine('separation','Separation hardware · no modeled AGC command',CM,None,0,0,'Crew configuration and separation system','Release the appropriate module using its dedicated hardware.','Mechanical separation','The animation shows which hardware remains attached. The displayed source does not command module jettison.','hardware')
routine('entry-prepare','P61 / P62 · prepare entry',CM,'P61-P67.agc',154,181,'Entry state vector, landing target and IMU alignment','Change entry mode, check the navigation/IMU state and calculate desired entry attitude.','Desired 0.05 g attitude','Odyssey is oriented for entry. The heat shield, not the LM, is the primary thermal protection.')
routine('entry-guidance','P64 · atmospheric guidance',CM,'P61-P67.agc',315,352,'Atmospheric deceleration and current navigation state','Enter P64 when the 0.05 g condition is exceeded and initialize the next guidance phase.','Entry guidance state and displays','The complete entry algorithm determines bank guidance through several phases; this snippet shows a phase transition, not the entire trajectory solution.')
routine('entry-attitude','CM entry DAP · drive the jets',CM,'CM_ENTRY_DIGITAL_AUTOPILOT.agc',480,501,'Entry attitude/rate errors and selected jets','Update the pitch/yaw jet output word.','WRITE PYJETS','RCS changes the capsule’s attitude. Aerodynamic lift and drag then shape the entry path; this is distinct from a propulsion burn.')
routine('chutes','Earth landing system · recovery',CM,None,0,0,'Altitude/sequence conditions and crew backup controls','Deploy drogues and main parachutes through the landing system.','Drag from parachutes','No invented AGC parachute routine. The three main canopies and ocean descent are an illustrative hardware sequence.','hardware')
(ROOT/'data/routines.json').write_text(json.dumps(routines,separators=(',',':')))
manifest={'upstream':'virtualagc/virtualagc','commit':SHA,'sourceLicense':'Public domain per file headers','emulatorLicense':'GPL-2.0-or-later','programs':{}}
for program in [LM,CM]:
 files={p.name:p.read_text().splitlines() for p in sorted((UP/program).glob('*.agc'))}
 addresses={}
 for p in sorted((UP/program).glob('*.agc.html')):
  # Generated yaYUL listing carries exact local source-line numbers and octal bank/address.
  for raw in p.read_text().splitlines():
   line=html.unescape(re.sub('<[^>]+>','',raw))
   m=re.search(r'^\d{6},(\d{6}):\s+(?:(\d{2}),)?([0-7]{4})\s+([0-7]{5})(?:\s|$)',line)
   if not m:continue
   local=int(m[1]); bank=int(m[2],8) if m[2] else (2 if int(m[3],8)<0o6000 else 3)
   address=int(m[3],8)
   if not m[2] and address<0o4000:continue
   key=f'{bank:02o},{0o2000+(address&0o1777):04o}'
   fn=p.name[:-5]
   if 0<local<=len(files.get(fn,[])):addresses[key]=[fn,local,m[4]]
 payload=json.dumps({'program':program,'commit':SHA,'files':files,'addresses':addresses},separators=(',',':')).encode()
 (ROOT/'public/agc'/f'{program}-source.json').write_bytes(payload)
 rope=(ROOT/'public/agc'/f'{program}.bin').read_bytes()
 manifest['programs'][program]={'ropeSha256':hashlib.sha256(rope).hexdigest(),'ropeBytes':len(rope),'sourceFiles':len(files),'mappedWords':len(addresses),'sourceIndexSha256':hashlib.sha256(payload).hexdigest()}
manifest['programs'][LM]['provenance']='Reconstructed from Luminary131 listing plus flown B5 module dump; all 36,864 data words match the upstream composite dump after parity bits are removed.'
manifest['programs'][CM]['provenance']='Reconstructed from Comanche072 plus approved Manche72 change; bank checksums match. Upstream notes two instruction-order ambiguities inherited from Comanche072; no original complete listing or rope dump is available.'
manifest['wasmSha256']=hashlib.sha256((ROOT/'public/agc/yaAGC.wasm').read_bytes()).hexdigest()
(ROOT/'data/provenance.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
