const { useState, useEffect } = React;

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="card">
      <h2>Вход</h2>
      <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Логин" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" />
      <button onClick={()=>onLogin(username)}>Войти</button>
    </div>
  );
}

function Tree({ tree, onWater, onCollect, onUpgrade }) {
  return (
    <div className="card">
      <h3>Дерево уровень {tree.level}</h3>
      <p>Фруктов на дереве: {tree.fruits}</p>
      <button onClick={onWater}>Полить</button>
      <button onClick={onCollect}>Собрать</button>
      <button onClick={onUpgrade}>Апгрейд (стоимость {tree.level*20})</button>
    </div>
  );
}

function Warehouse({ inventory, sellAll }) {
  return (
    <div className="card">
      <h3>Склад</h3>
      <p>Ящиков: {inventory.boxes.length}/{inventory.capacity}</p>
      <ul>
        {inventory.boxes.map((b,i)=>(<li key={i}>Ящик {i+1}: {b} фруктов</li>))}
      </ul>
      <button onClick={sellAll}>Продать все ({inventory.boxes.reduce((a,b)=>a+b,0)})</button>
    </div>
  );
}

function Game({ user, setUser }) {
  const initialTree = { id:1, level:1, lastWatered: Date.now(), fruits:0 };
  const [plots, setPlots] = useState([{ id:1, capacity:1, trees:[initialTree] }]);
  const [inventory, setInventory] = useState({ boxes:[], capacity:2, boxCapacity:50 });
  const [showWarehouse, setShowWarehouse] = useState(false);

  useEffect(()=>{
    const interval = setInterval(()=>{
      setPlots(oldPlots => oldPlots.map(plot=>({
        ...plot,
        trees: plot.trees.map(tree=>{
          let fruits = tree.fruits;
          if (Date.now() - tree.lastWatered < 30000) {
            fruits += tree.level; // каждую секунду = 1 час в игре
          }
          return { ...tree, fruits };
        })
      })));
    },1000);
    return ()=>clearInterval(interval);
  },[]);

  function addFruits(count) {
    setInventory(inv=>{
      const boxes = [...inv.boxes];
      let rem = count;
      for(let i=0;i<boxes.length && rem>0;i++){
        const space = inv.boxCapacity - boxes[i];
        const add = Math.min(space, rem);
        boxes[i]+=add;
        rem-=add;
      }
      while(rem>0 && boxes.length < inv.capacity){
        const add = Math.min(inv.boxCapacity, rem);
        boxes.push(add);
        rem-=add;
      }
      return {...inv, boxes};
    });
  }

  function water(plotIdx, treeIdx){
    setPlots(ps=>ps.map((p,i)=>i===plotIdx?{
      ...p,
      trees:p.trees.map((t,j)=>j===treeIdx?{...t,lastWatered:Date.now()}:t)
    }:p));
  }

  function collect(plotIdx, treeIdx){
    const tree = plots[plotIdx].trees[treeIdx];
    addFruits(tree.fruits);
    setPlots(ps=>ps.map((p,i)=>i===plotIdx?{
      ...p,
      trees:p.trees.map((t,j)=>j===treeIdx?{...t,fruits:0}:t)
    }:p));
  }

  function upgrade(plotIdx, treeIdx){
    const tree = plots[plotIdx].trees[treeIdx];
    const cost = tree.level*20;
    if(user.coins < cost) return alert('Недостаточно монет');
    setUser(u=>({...u, coins:u.coins - cost}));
    setPlots(ps=>ps.map((p,i)=>i===plotIdx?{
      ...p,
      trees:p.trees.map((t,j)=>j===treeIdx?{...t,level:t.level+1}:t)
    }:p));
  }

  function sellAll(){
    const total = inventory.boxes.reduce((a,b)=>a+b,0);
    if(total===0) return;
    setInventory(inv=>({...inv, boxes:[]}));
    setUser(u=>({...u, coins:u.coins+total}));
  }

  function buyTree(plotIdx){
    const cost = 30;
    if(user.coins < cost) return alert('Недостаточно монет');
    setUser(u=>({...u, coins:u.coins-cost}));
    setPlots(ps=>ps.map((p,i)=>i===plotIdx?{
      ...p,
      trees:[...p.trees,{ id:Date.now(), level:1, lastWatered:Date.now(), fruits:0 }]
    }:p));
  }

  function buyPlot(){
    const cost=50;
    if(user.coins < cost) return alert('Недостаточно монет');
    setUser(u=>({...u, coins:u.coins-cost}));
    setPlots(ps=>[...ps,{ id:Date.now(), capacity:1, trees:[{ id:Date.now()+1, level:1, lastWatered:Date.now(), fruits:0 }] }]);
  }

  return (
    <div>
      <h2>Привет, {user.name}! Монеты: {user.coins}</h2>
      <button onClick={()=>setShowWarehouse(!showWarehouse)}>
        {showWarehouse? 'Скрыть склад':'Открыть склад'}
      </button>
      {showWarehouse && <Warehouse inventory={inventory} sellAll={sellAll} />}
      {plots.map((plot,pi)=>(
        <div key={plot.id} className="card">
          <h3>Участок {pi+1}</h3>
          {plot.trees.map((tree,ti)=>(
            <Tree key={tree.id} tree={tree}
              onWater={()=>water(pi,ti)}
              onCollect={()=>collect(pi,ti)}
              onUpgrade={()=>upgrade(pi,ti)} />
          ))}
          {plot.trees.length < plot.capacity && <button onClick={()=>buyTree(pi)}>Купить дерево (30)</button>}
        </div>
      ))}
      <button onClick={buyPlot}>Купить участок (50)</button>
    </div>
  );
}

function App(){
  const [user,setUser] = useState(null);
  function handleLogin(name){
    if(!name) return;
    setUser({ name, coins:100 });
  }
  if(!user) return <Login onLogin={handleLogin} />;
  return <Game user={user} setUser={setUser} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
