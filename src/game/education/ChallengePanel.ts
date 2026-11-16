import {MissionPuzzle,type PuzzleKind} from './MissionPuzzles';

const instructions:Record<PuzzleKind,{title:string;lead:string;choices:string[]}>= {
  memory:{title:'Эхо светлячков',lead:'Запомни три огонька. Потом повтори их порядок.',choices:['🔵','🟡','🔴']},
  count:{title:'Батареи для друга',lead:'Нажми на четыре батареи и загрузи их. Лишнюю можно убрать.',choices:[]},
  mirrors:{title:'Зеркальная тропа',lead:'Поверни зеркала, чтобы луч прошёл по трём стрелкам.',choices:[]},
  shapes:{title:'Шестерёнки узора',lead:'Посмотри на верхний ряд и повтори его снизу.',choices:['●','★']}
};

export class ChallengePanel {
  private readonly root:HTMLElement;
  private readonly message:HTMLElement;
  private readonly playArea:HTMLElement;
  private readonly replay:HTMLButtonElement;
  private puzzle:MissionPuzzle|null=null;
  private revealTimer:number|null=null;
  private revealed=false;
  onComplete:(kind:PuzzleKind)=>void=()=>{};
  constructor(host:HTMLElement){
    this.root=document.createElement('section');
    this.root.id='challenge';this.root.className='overlay hidden';
    this.root.setAttribute('aria-label','Головоломка миссии');
    this.root.innerHTML='<article class="challenge-card"><div class="eyebrow">МИССИЯ НА СМЕКАЛКУ</div><h2 id="challenge-title"></h2><p id="challenge-lead"></p><div id="challenge-play"></div><p id="challenge-message" role="status"></p><div class="actions"><button id="challenge-replay">👀 Посмотреть ещё</button><button id="challenge-later">Позже</button></div></article>';
    host.append(this.root);
    this.message=this.root.querySelector('#challenge-message')!;
    this.playArea=this.root.querySelector('#challenge-play')!;
    this.replay=this.root.querySelector('#challenge-replay')!;
    this.replay.addEventListener('click',()=>this.showPattern());
    this.root.querySelector('#challenge-later')!.addEventListener('click',()=>this.close());
    this.playArea.addEventListener('click',event=>{
      const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-choice]');
      if(!button||!this.puzzle)return;
      const result=button.dataset.choice==='submit'?this.puzzle.submitCount():this.puzzle.choose(button.dataset.choice!);
      this.message.textContent=result.message;
      this.render();
      if(result.complete){
        const kind=this.puzzle.kind;
        window.setTimeout(()=>{this.close();this.onComplete(kind);},650);
      }
    });
  }
  get open():boolean{return !this.root.classList.contains('hidden');}
  openPuzzle(kind:PuzzleKind):void{
    this.puzzle=new MissionPuzzle(kind);this.revealed=false;
    this.root.querySelector('#challenge-title')!.textContent=instructions[kind].title;
    this.root.querySelector('#challenge-lead')!.textContent=instructions[kind].lead;
    this.message.textContent='Можно пробовать сколько угодно раз.';
    this.replay.hidden=kind==='count'||kind==='mirrors';
    this.root.classList.remove('hidden');
    if(kind==='memory')this.showPattern();else{this.revealed=true;this.render();}
  }
  close():void{
    if(this.revealTimer!==null)window.clearTimeout(this.revealTimer);
    this.revealTimer=null;this.root.classList.add('hidden');
  }
  private showPattern():void{
    if(!this.puzzle)return;
    this.revealed=true;this.render();
    if(this.revealTimer!==null)window.clearTimeout(this.revealTimer);
    if(this.puzzle.kind==='memory')this.revealTimer=window.setTimeout(()=>{
      this.revealed=false;this.render();this.message.textContent='Теперь повтори огоньки!';
    },3600);
  }
  private render():void{
    if(!this.puzzle)return;
    const puzzle=this.puzzle,kind=puzzle.kind;
    this.playArea.replaceChildren();
    const make=(label:string,value:string,selected=false)=>{
      const button=document.createElement('button');button.type='button';button.className='challenge-choice'+(selected?' selected':'');
      button.dataset.choice=value;button.textContent=label;return button;
    };
    const row=(label:string)=>{const div=document.createElement('div');div.className='challenge-row';div.setAttribute('aria-label',label);this.playArea.append(div);return div;};
    if(kind==='memory'||kind==='shapes'){
      const sample=row('Узор');
      for(const symbol of puzzle.sequence){const tile=document.createElement('span');tile.className='challenge-sample';
        tile.textContent=kind==='memory'&&!this.revealed?'?':symbol;sample.append(tile);}
      const choices=row('Выбор');
      for(const choice of instructions[kind].choices)choices.append(make(choice,choice));
      const score=document.createElement('div');score.className='challenge-score';
      score.textContent=`Повторено ${puzzle.progress} / 3`;this.playArea.append(score);
    }else if(kind==='count'){
      const cells=row('Батареи');
      for(let i=0;i<6;i++)cells.append(make('⚡',String(i),puzzle.selectedIndices.includes(i)));
      const score=document.createElement('div');score.className='challenge-score';score.textContent=`В корзине ${puzzle.progress} / 4`;this.playArea.append(score);
      const submit=make('Загрузить батареи','submit');submit.classList.add('challenge-submit');this.playArea.append(submit);
    }else{
      const sample=row('Куда должен идти луч');
      for(const symbol of puzzle.sequence){const tile=document.createElement('span');tile.className='challenge-sample';tile.textContent=symbol;sample.append(tile);}
      const choices=row('Поверни зеркало');
      puzzle.values.forEach((value,index)=>choices.append(make(value,String(index),value===puzzle.sequence[index])));
      const score=document.createElement('div');score.className='challenge-score';score.textContent=`Совпало ${puzzle.progress} / 3`;this.playArea.append(score);
    }
  }
}
