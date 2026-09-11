export const diagnosticQuestions=[
 'What happened? Describe one recent incident and the missed commitment, using a date or number.',
 'Why did that happen? Name the behavior or decision you controlled, rather than someone else’s reaction.',
 'How does that behavior keep repeating? Describe the trigger and what you do next.',
 'What difficult conversation or task are you replacing with an easier activity? Give a concrete example.'
];
export function mentorFeedback(p:{title:string;baseline:number;target:number;unit:string;deadline:string;direction:string;domain:string;reason:string}) {
 if(!p.title.trim()||!p.unit.trim()||!p.deadline||!Number.isFinite(p.target)||p.target<=0||!Number.isFinite(p.baseline)||p.baseline<0)
   return {status:'revise',feedback:'A vague intention is not a target. Give me a starting number, a target, a unit, and a hard deadline.'};
 if((p.direction==='increase'&&p.target<=p.baseline)||(p.direction==='decrease'&&p.target>=p.baseline))
   return {status:'revise',feedback:'Your target does not move beyond your starting point in the direction you chose. Revise the number.'};
 const factor=p.baseline>0?(p.direction==='increase'?p.target/p.baseline:p.baseline/p.target):null;
 if(p.domain!=='Health'&&factor!==null&&factor<10&&p.reason.trim().length<40)
   return {status:'revise',feedback:`That is a ${factor.toFixed(1)}× change from your baseline. Why is this the right ambition over ten years? Raise the target or provide concrete constraints and evidence (at least 40 characters).`};
 if(p.reason.trim().length<20)return {status:'revise',feedback:'Give the reasoning behind this target: what must change, and what evidence makes the goal meaningful?'};
 return {status:'ready',feedback:p.domain==='Health'?'Your target is measurable. Health progress needs a sustainable, individually appropriate standard. Now define the intermediate milestones.':'The target is measurable and your reasoning is recorded. Now show the path: three years, one year, and this quarter.'};
}
