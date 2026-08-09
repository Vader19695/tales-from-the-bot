---
title: "The Pattern"
date: 2026-08-09T13:19:49Z
model: claude-sonnet-4-5
slug: the-ammonia-whistle-protocol
prompt: "At a municipal water treatment plant's night shift, a routine operator notices the ammonia sensors are behaving strangely—fluctuating in a pattern too regular to be accidental. As she investigates with her skeptical colleague, they uncover that someone has been deliberately triggering false alarms to mask something else happening in the facility. Write this as a tense procedural puzzle, balancing technical realism with the growing realization that one of their own team members may have a desperate reason for the deception. The tone should be cool and observant, with dry workplace banter undercutting the moral stakes."
---

The ammonia sensor on Basin Three spiked at 11:47 PM, right on schedule.

Maya pressed her palm against the cool metal desk and watched the graph climb to 4.2 ppm before settling back to baseline. She'd seen it happen four times in the past week, always during night shift, always Basin Three, always between 11:45 and midnight.

"There it goes again," she said.

Derek looked up from his phone, squinting at the SCADA screen. "Calibration's probably off. I'll put in a work order Monday."

"It's not calibration. Look at the interval." Maya pulled up the historical data, highlighting the spikes. "Every forty-seven minutes. Like clockwork."

"So it's electrical interference. Pump motor cycling or something." Derek returned to his phone, scrolling through what Maya assumed was another dating app. "You're overthinking this."

Maya had been a process operator for six years—long enough to know when something didn't fit. Natural fluctuations were chaotic. Equipment failures were random. This was neither.

She grabbed her tablet and hard hat. "I'm doing a walk-through."

"It's two in the morning."

"That's why they call it night shift."

The treatment plant sprawled across eight acres of concrete basins and steel pipes, humming with the constant work of processing two million gallons daily. Maya's boots echoed on the metal catwalks as she made her way to Basin Three, the tablet's screen casting blue light across the dark water below.

The ammonia sensor looked normal—no obvious damage, connections tight. She was about to head back when she noticed footprints in the calcium carbonate dust that accumulated on the walkways. Fresh ones, leading to the chlorination building.

The chlorination building should have been empty. All the dosing systems were automated.

Maya found the door unlocked.

Inside, Tommy Chen hunched over the chlorine analyzer, a laptop balanced on the equipment housing. He jumped when her flashlight beam hit him.

"Jesus, Maya. You scared the hell out of me."

Tommy was one of their senior operators, fifteen years on the job. Quiet guy. Reliable. His hands were shaking.

"What are you doing?" Maya asked.

"Just... checking the residuals. Making sure the PID loops are optimized."

"At two AM? With your personal laptop?"

Tommy's face went through several expressions before settling on resignation. "You noticed the ammonia spikes."

"Hard not to."

He closed the laptop. "I've been triggering them. Writing a script to send false readings through the RTU."

Maya's hand moved instinctively toward the radio on her belt. "You're contaminating the data stream. We could miss a real event."

"I'm not interfering with real readings, just injecting extra ones. And only on Basin Three, which has redundant monitoring." He rubbed his face. "I needed everyone looking the other way."

"For what?"

Tommy gestured at the chlorination system. "About three months ago, I started noticing our chlorine efficiency dropping. Not enough to trigger alarms, but consistent. I ran numbers—we've been overdosing by about twelve percent."

"So tell maintenance."

"I did. They said everything was in spec, told me to stop worrying." He opened the laptop, showing her spreadsheets dense with calculations. "I started testing manually, pulling samples after hours. The flow meters are reading low. Not broken—calibrated wrong. Someone did it deliberately."

Maya felt something cold settle in her stomach. "Why would anyone do that?"

"Chlorine supplier has a contract with volume incentives. We use twelve percent more, they get a bonus tier. Plant superintendent's brother-in-law works for the supplier."

"That's..." Maya struggled for words. "We need to report this."

"With what proof? My unauthorized testing during my off-hours? The data I collected by hacking our own sensors?" Tommy laughed bitterly. "I needed time to build a case that couldn't be dismissed. The ammonia spikes kept attention on the biological treatment side while I worked over here."

Maya looked at the laptop, at Tommy's exhausted face, at the chlorination system quietly overdosing the city's water supply by twelve percent—not enough to be dangerous, just enough to be profitable.

Derek's voice crackled on her radio. "Maya? Basin Seven's UV system just alarmed. Need you back here."

She keyed the mic. "Copy. On my way." She looked at Tommy. "Monday morning, we're both walking into the director's office. We'll bring your data and deal with the consequences together."

Tommy nodded slowly. "Okay."

"And Tommy? Stop screwing with my sensors. There are better ways to be subtle."

For the first time in hours, he almost smiled. "Noted."
