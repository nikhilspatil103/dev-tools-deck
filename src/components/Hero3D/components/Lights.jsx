function Lights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#5B8CFF" />
    </>
  );
}

export default Lights;
