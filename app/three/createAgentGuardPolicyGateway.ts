import * as THREE from "three";

export interface AgentGuardPolicyGatewayRuntime {
  group: THREE.Group;
  activate: (reduceMotion: boolean) => void;
  update: (time: number, dt: number, ambientPaused: boolean) => void;
  setExploded: (progress: number) => void;
}

type StatusWriter = (value: string) => void;

const INTERACTION_TIME_SCALE = 1.75;

function extrudedPolygon(
  points: Array<[number, number]>,
  depth: number,
  bevelSize: number,
) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize,
    bevelThickness: bevelSize * 0.72,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geometry.center();
  return geometry;
}

function octagonalFrame(outerRadius: number, innerRadius: number, depth: number) {
  const points = Array.from({ length: 8 }, (_, index) => {
    const angle = Math.PI / 8 + (index / 8) * Math.PI * 2;
    return [Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius] as const;
  });
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  const hole = new THREE.Path();
  [...points].reverse().forEach((_, index) => {
    const angle = Math.PI / 8 - (index / 8) * Math.PI * 2;
    const x = Math.cos(angle) * innerRadius;
    const y = Math.sin(angle) * innerRadius;
    if (index === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  });
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.018,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geometry.center();
  return geometry;
}

function cylinderBetween(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegments = 12,
) {
  const direction = to.clone().sub(from);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments),
    material,
  );
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function quadraticPoint(
  start: THREE.Vector3,
  control: THREE.Vector3,
  end: THREE.Vector3,
  progress: number,
) {
  const inverse = 1 - progress;
  return new THREE.Vector3(
    inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
    inverse * inverse * start.z + 2 * inverse * progress * control.z + progress * progress * end.z,
  );
}

export function createAgentGuardPolicyGateway(setStatus: StatusWriter): AgentGuardPolicyGatewayRuntime {
  const group = new THREE.Group();
  group.name = "agentguard-policy-gateway";

  const graphite = new THREE.MeshPhysicalMaterial({
    color: 0x18211c,
    roughness: 0.3,
    metalness: 0.62,
    clearcoat: 0.46,
    clearcoatRoughness: 0.28,
  });
  const graphiteSoft = new THREE.MeshPhysicalMaterial({
    color: 0x344038,
    roughness: 0.48,
    metalness: 0.36,
    clearcoat: 0.22,
  });
  const lime = new THREE.MeshPhysicalMaterial({
    color: 0xc8ff42,
    emissive: 0x557712,
    emissiveIntensity: 0.34,
    roughness: 0.24,
    metalness: 0.08,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
  });
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xe8ece2,
    roughness: 0.29,
    metalness: 0.04,
    clearcoat: 0.48,
    clearcoatRoughness: 0.22,
  });
  const blocked = new THREE.MeshPhysicalMaterial({
    color: 0xff674d,
    emissive: 0x8c1e12,
    emissiveIntensity: 0.28,
    roughness: 0.3,
    metalness: 0.06,
    clearcoat: 0.56,
  });

  const inspectionRing = new THREE.Group();
  inspectionRing.name = "inspection-ring";
  const ringMesh = new THREE.Mesh(octagonalFrame(0.96, 0.76, 0.18), graphiteSoft);
  ringMesh.name = "inspection-ring-shell";
  ringMesh.castShadow = true;
  inspectionRing.add(ringMesh);
  group.add(inspectionRing);

  const policyCore = new THREE.Group();
  policyCore.name = "policy-core";
  const shieldPoints: Array<[number, number]> = [
    [0, 0.72],
    [0.58, 0.38],
    [0.5, -0.42],
    [0, -0.82],
    [-0.5, -0.42],
    [-0.58, 0.38],
  ];
  const coreShell = new THREE.Mesh(extrudedPolygon(shieldPoints, 0.32, 0.055), graphite);
  coreShell.name = "policy-core-shell";
  coreShell.castShadow = true;
  policyCore.add(coreShell);

  const inlay = new THREE.Mesh(extrudedPolygon(shieldPoints, 0.055, 0.024), lime);
  inlay.name = "policy-core-inlay";
  inlay.userData.explodeWithParent = true;
  inlay.scale.setScalar(0.77);
  inlay.position.z = 0.19;
  policyCore.add(inlay);

  const facePlate = new THREE.Mesh(extrudedPolygon(shieldPoints, 0.04, 0.018), graphite);
  facePlate.name = "policy-core-faceplate";
  facePlate.userData.explodeWithParent = true;
  facePlate.scale.setScalar(0.58);
  facePlate.position.z = 0.235;
  policyCore.add(facePlate);

  const grooves = [-0.18, 0, 0.18].map((x, index) => {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(index === 1 ? 0.035 : 0.028, 0.48 - Math.abs(x) * 0.55, 0.035),
      index === 1 ? ceramic : graphiteSoft,
    );
    groove.name = `policy-groove-${index + 1}`;
    groove.userData.explodeWithParent = true;
    groove.position.set(x, 0.02, 0.275);
    groove.rotation.z = x * -0.5;
    policyCore.add(groove);
    return groove;
  });
  group.add(policyCore);

  const clamps = Array.from({ length: 4 }, (_, index) => {
    const angle = Math.PI / 4 + index * Math.PI / 2;
    const clamp = new THREE.Group();
    clamp.name = `ring-clamp-${index + 1}`;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.3), graphite);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 12), ceramic);
    foot.name = `ring-clamp-${index + 1}-foot`;
    pin.name = `ring-clamp-${index + 1}-pin`;
    foot.userData.explodeWithParent = true;
    pin.userData.explodeWithParent = true;
    pin.rotation.x = Math.PI / 2;
    pin.position.z = 0.04;
    clamp.add(foot, pin);
    clamp.position.set(Math.cos(angle) * 0.89, Math.sin(angle) * 0.89, 0.02);
    clamp.rotation.z = angle;
    inspectionRing.add(clamp);
    return clamp;
  });

  const ingressRail = new THREE.Group();
  ingressRail.name = "ingress-rail";
  [-0.13, 0.13].forEach((y, index) => {
    const rail = cylinderBetween(
      new THREE.Vector3(-1.72, y, -0.02),
      new THREE.Vector3(-0.88, y, -0.02),
      0.025,
      ceramic,
    );
    rail.name = `ingress-rail-${index + 1}`;
    rail.userData.explodeWithParent = true;
    ingressRail.add(rail);
  });
  const ingressSocket = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 10, 28), graphiteSoft);
  ingressSocket.name = "ingress-socket";
  ingressSocket.userData.explodeWithParent = true;
  ingressSocket.position.set(-1.69, 0, -0.02);
  ingressRail.add(ingressSocket);
  group.add(ingressRail);

  const egressRail = new THREE.Group();
  egressRail.name = "protected-egress";
  [-0.13, 0.13].forEach((y, index) => {
    const rail = cylinderBetween(
      new THREE.Vector3(0.88, y, -0.02),
      new THREE.Vector3(1.48, y, -0.02),
      0.025,
      graphiteSoft,
    );
    rail.name = `protected-egress-rail-${index + 1}`;
    rail.userData.explodeWithParent = true;
    egressRail.add(rail);
  });
  const egressOuter = new THREE.Mesh(new THREE.DodecahedronGeometry(0.31, 1), graphite);
  egressOuter.name = "protected-egress-shell";
  egressOuter.position.set(1.62, 0, 0);
  const egressInner = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), lime);
  egressInner.name = "protected-egress-core";
  egressInner.userData.explodeWithParent = true;
  egressInner.position.set(1.62, 0, 0.2);
  egressRail.add(egressOuter, egressInner);
  group.add(egressRail);

  const quarantineBranch = new THREE.Group();
  quarantineBranch.name = "quarantine-branch";
  const quarantineStart = new THREE.Vector3(-0.28, -0.72, -0.02);
  const quarantineEnd = new THREE.Vector3(-0.62, -1.34, 0.02);
  const quarantineConduit = cylinderBetween(quarantineStart, quarantineEnd, 0.045, graphiteSoft);
  quarantineConduit.name = "quarantine-conduit";
  quarantineConduit.userData.explodeWithParent = true;
  quarantineBranch.add(quarantineConduit);
  const quarantineStop = new THREE.Mesh(new THREE.OctahedronGeometry(0.19, 1), blocked);
  quarantineStop.name = "quarantine-stop";
  quarantineStop.userData.explodeWithParent = true;
  quarantineStop.position.copy(quarantineEnd);
  quarantineStop.position.z = 0.08;
  quarantineBranch.add(quarantineStop);
  group.add(quarantineBranch);

  const stopMarker = new THREE.Group();
  stopMarker.name = "block-marker";
  const stopRing = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.036, 10, 32), blocked);
  const stopSlash = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.43, 0.045), blocked);
  stopRing.name = "block-marker-ring";
  stopSlash.name = "block-marker-slash";
  stopRing.userData.explodeWithParent = true;
  stopSlash.userData.explodeWithParent = true;
  stopSlash.rotation.z = -Math.PI / 4;
  stopMarker.add(stopRing, stopSlash);
  stopMarker.position.z = 0.34;
  stopMarker.scale.setScalar(0.001);
  policyCore.add(stopMarker);

  const statusPins = [-0.18, 0, 0.18].map((x) => {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), ceramic);
    pin.name = `status-pin-${x < 0 ? "left" : x > 0 ? "right" : "center"}`;
    pin.userData.explodeWithParent = true;
    pin.position.set(x, 1.09, 0.02);
    group.add(pin);
    return pin;
  });

  const packet = new THREE.Group();
  packet.name = "tool-call-packet";
  const packetBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), ceramic);
  packetBody.name = "tool-call-packet-body";
  packetBody.userData.explodeWithParent = true;
  packetBody.castShadow = true;
  const packetBelt = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.027, 8, 20), lime);
  packetBelt.name = "tool-call-packet-seam";
  packetBelt.userData.explodeWithParent = true;
  packetBelt.rotation.y = Math.PI / 2;
  packet.add(packetBody, packetBelt);
  const ingressPosition = new THREE.Vector3(-1.65, 0, 0.2);
  const inspectionPosition = new THREE.Vector3(-0.7, 0, 0.2);
  const redirectControl = new THREE.Vector3(-0.24, -0.62, 0.46);
  const quarantinePosition = quarantineEnd.clone().add(new THREE.Vector3(0, 0, 0.18));
  packet.position.copy(ingressPosition);
  group.add(packet);

  const restPositions = new Map<THREE.Object3D, THREE.Vector3>();
  [policyCore, inspectionRing, ingressRail, egressRail, quarantineBranch].forEach((part) => {
    restPositions.set(part, part.position.clone());
  });

  const sockets = {
    ingress: new THREE.Vector3(-1.69, 0, 0),
    policyBoundary: new THREE.Vector3(-0.7, 0, 0.2),
    protectedEgress: new THREE.Vector3(1.62, 0, 0),
    quarantine: quarantinePosition.clone(),
  };
  group.userData.sculptRuntime = {
    clickable: true,
    explodable: true,
    nodes: { policyCore, inspectionRing, ingressRail, egressRail, quarantineBranch, packet },
    sockets,
    destructionGroups: {
      gateAssembly: ["policy-core", "inspection-ring"],
      transportAssembly: ["ingress-rail", "protected-egress", "quarantine-branch"],
    },
  };

  let actionStarted = 0;
  let phase = -1;
  let blockedState = false;

  const setBlockedState = () => {
    packet.position.copy(quarantinePosition);
    packetBelt.material = blocked;
    stopMarker.scale.setScalar(1);
    inspectionRing.rotation.z = Math.PI / 8;
    statusPins.forEach((pin, index) => {
      pin.material = index === 1 ? blocked : graphiteSoft;
    });
    setStatus("Risky call quarantined");
    blockedState = true;
  };

  return {
    group,
    activate: (reduceMotion) => {
      actionStarted = reduceMotion ? 0 : performance.now();
      phase = -1;
      blockedState = false;
      packet.position.copy(ingressPosition);
      packet.rotation.set(0, 0, 0);
      packetBelt.material = lime;
      stopMarker.scale.setScalar(0.001);
      inspectionRing.rotation.z = 0;
      policyCore.rotation.z = 0;
      grooves.forEach((groove) => groove.scale.setScalar(1));
      clamps.forEach((clamp) => clamp.scale.setScalar(1));
      statusPins.forEach((pin) => { pin.material = ceramic; });
      if (reduceMotion) {
        setBlockedState();
        return;
      }
      setStatus("Inspecting tool call");
    },
    update: (time, _dt, ambientPaused) => {
      if (!ambientPaused && !actionStarted && !blockedState) {
        inspectionRing.rotation.z = Math.sin(time * 0.00042) * 0.035;
        egressInner.scale.setScalar(1 + Math.sin(time * 0.0016) * 0.035);
      }
      if (!actionStarted) return;

      const elapsed = (performance.now() - actionStarted) / 1000 / INTERACTION_TIME_SCALE;
      if (elapsed < 0.48) {
        const progress = 1 - Math.pow(1 - elapsed / 0.48, 3);
        packet.position.lerpVectors(ingressPosition, inspectionPosition, progress);
        packet.rotation.x += 0.075;
        packet.rotation.y += 0.095;
      } else if (elapsed < 0.84) {
        const progress = (elapsed - 0.48) / 0.36;
        if (phase < 1) {
          phase = 1;
          setStatus("Policy mismatch found");
        }
        inspectionRing.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 8, progress);
        policyCore.rotation.z = Math.sin(progress * Math.PI) * -0.055;
        grooves.forEach((groove, index) => {
          groove.scale.y = 1 + Math.sin(progress * Math.PI) * (0.22 + index * 0.04);
        });
        clamps.forEach((clamp) => clamp.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.09));
      } else if (elapsed < 1.42) {
        const progress = 1 - Math.pow(1 - (elapsed - 0.84) / 0.58, 3);
        if (phase < 2) {
          phase = 2;
          packetBelt.material = blocked;
          setStatus("Redirecting to quarantine");
        }
        packet.position.copy(quadraticPoint(inspectionPosition, redirectControl, quarantinePosition, progress));
        packet.rotation.z += 0.12;
        stopMarker.scale.setScalar(0.001 + Math.sin(progress * Math.PI) * 1.08);
      } else {
        setBlockedState();
        actionStarted = 0;
      }
    },
    setExploded: (progress) => {
      const amount = THREE.MathUtils.clamp(progress, 0, 1);
      const directions = [
        new THREE.Vector3(0, 0, 0.45),
        new THREE.Vector3(0, 0, -0.5),
        new THREE.Vector3(-0.55, 0, 0),
        new THREE.Vector3(0.55, 0, 0),
        new THREE.Vector3(-0.22, -0.42, 0),
      ];
      [policyCore, inspectionRing, ingressRail, egressRail, quarantineBranch].forEach((part, index) => {
        const rest = restPositions.get(part) ?? new THREE.Vector3();
        part.position.copy(rest).addScaledVector(directions[index], amount);
      });
    },
  };
}
