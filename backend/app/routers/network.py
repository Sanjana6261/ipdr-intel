import math, random
from collections import defaultdict
from fastapi import APIRouter, HTTPException
import networkx as nx
from app.seed_data import get_demo_data

router = APIRouter()

try:
    import community as community_louvain
    HAS_LOUVAIN = True
except ImportError:
    HAS_LOUVAIN = False

ROLE_CLASSIFY = {
    (0.7, 1.0): "Leader",
    (0.4, 0.7): "Gatekeeper",
    (0.1, 0.4): "Follower",
    (0.0, 0.1): "Peripheral",
}

def classify_role(betweenness: float) -> str:
    for (lo, hi), role in ROLE_CLASSIFY.items():
        if lo <= betweenness <= hi:
            return role
    return "Peripheral"

def risk_from_degree(d: int) -> str:
    if d >= 30: return "critical"
    if d >= 15: return "high"
    if d >= 5:  return "medium"
    return "low"

def build_graph_for_subject(subject_id: str, depth: int = 1, time_of_day: str = None, max_duration_mins: int = None):
    demo = get_demo_data()
    phone = demo["phones"].get(subject_id)
    if not phone:
        raise HTTPException(404, f"Subject {subject_id} not found")

    # Filter records based on criteria
    valid_records = []
    for r in demo["records"]:
        if time_of_day and time_of_day != "all":
            try:
                hour = int(r["start_time"].split()[1].split(":")[0])
                if time_of_day == "night" and not (hour < 6 or hour >= 22): continue
                if time_of_day == "day" and not (6 <= hour < 22): continue
            except: pass
            
        if max_duration_mins and max_duration_mins > 0:
            dur = r.get("duration")
            if dur is not None and dur > max_duration_mins * 60:
                continue
                
        valid_records.append(r)

    # Find all communications involving this subject
    G = nx.Graph()
    edge_data = defaultdict(lambda: {"count": 0, "type": "voice"})

    # Level 1: direct contacts
    l1_phones = set()
    for r in valid_records:
        if r["a_party"] == phone:
            l1_phones.add(r["b_party"])
            key = (phone, r["b_party"])
            edge_data[key]["count"] += 1
            edge_data[key]["type"] = r.get("call_type", "voice")
        elif r["b_party"] == phone:
            l1_phones.add(r["a_party"])
            key = (r["a_party"], phone)
            edge_data[key]["count"] += 1

    # Level 2
    l2_phones = set()
    if depth >= 2:
        for r in valid_records:
            if r["a_party"] in l1_phones and r["b_party"] not in l1_phones and r["b_party"] != phone:
                if len(l2_phones) < 100:  # cap
                    l2_phones.add(r["b_party"])
                    key = (r["a_party"], r["b_party"])
                    edge_data[key]["count"] += 1
                    edge_data[key]["type"] = r.get("call_type", "voice")

    # Build NetworkX graph
    all_phones = {phone} | l1_phones | l2_phones
    for p in all_phones:
        G.add_node(p)
    for (src, dst), data in edge_data.items():
        if src in all_phones and dst in all_phones:
            G.add_edge(src, dst, weight=data["count"], call_type=data["type"])

    if len(G.nodes) == 0:
        return {"nodes": [], "edges": []}

    # Centrality
    degree = dict(G.degree())
    try:
        betweenness = nx.betweenness_centrality(G, normalized=True, weight="weight")
    except:
        betweenness = {n: 0 for n in G.nodes}

    # Community detection
    if HAS_LOUVAIN and len(G.nodes) > 1:
        try:
            partition = community_louvain.best_partition(G)
        except:
            partition = {n: 0 for n in G.nodes}
    else:
        partition = {n: 0 for n in G.nodes}

    # Phone→subject_id reverse map
    phone_to_sid = {v: k for k, v in demo["phones"].items()}

    # Build nodes
    nodes = []
    for p in G.nodes:
        sid = phone_to_sid.get(p, "")
        deg = degree.get(p, 0)
        bet = betweenness.get(p, 0)
        nodes.append({
            "id": p,
            "label": sid if sid else p[-7:],
            "role": "subject" if p == phone else "contact",
            "node_role": classify_role(bet),
            "risk": risk_from_degree(deg),
            "community": partition.get(p, 0),
            "degree": deg,
            "betweenness": round(bet, 4),
            "call_count": sum(1 for r in valid_records if r["a_party"] == p or r["b_party"] == p),
            "operator": random.choice(["Jio","Airtel","Vi","BSNL"]),
        })

    # Build edges
    edges = []
    for src, dst, data in G.edges(data=True):
        edges.append({
            "source": src,
            "target": dst,
            "weight": data.get("weight", 1),
            "type": data.get("call_type", "voice"),
            "frequency": data.get("weight", 1),
        })

    return {"nodes": nodes, "edges": edges}

@router.get("/{subject_id}")
def get_network(subject_id: str, depth: int = 1, time_of_day: str = None, max_duration_mins: int = None):
    return build_graph_for_subject(subject_id, min(depth, 3), time_of_day, max_duration_mins)

@router.get("/{subject_id}/expand/{node_phone}")
def expand_node(subject_id: str, node_phone: str):
    # Returns immediate neighbors of the given phone
    demo = get_demo_data()
    neighbors = defaultdict(int)
    for r in demo["records"]:
        if r["a_party"] == node_phone:
            neighbors[r["b_party"]] += 1
        elif r["b_party"] == node_phone:
            neighbors[r["a_party"]] += 1
    nodes = [{"id": p, "label": p[-7:], "call_count": c} for p, c in list(neighbors.items())[:30]]
    edges = [{"source": node_phone, "target": n["id"], "weight": n["call_count"]} for n in nodes]
    return {"nodes": nodes, "edges": edges}
