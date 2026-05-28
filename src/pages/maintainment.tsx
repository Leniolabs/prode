import React from "react";
import { BrandLogo } from "../components/common/BrandLogo";
import { Layout, Footer, Container } from "@/layout";
import { LeniCamel } from "../components/view/Index";
import { HomeTitle } from "../components/common/HomeTitle";
import { LocaleSelect } from "../components/common/LocaleSelect";

export default function Home() {
  const [timer, setTimer] = React.useState(10);

  React.useEffect(() => {
    setInterval(() => {
      setTimer((timer) => {
        if (timer - 1 === 0) {
          window.location.reload();
        }
        return timer - 1;
      });
    }, 1000);
  }, []);

  return (
    <Layout>
      <Container direction="COL">
        <HomeTitle>Lenio Prode</HomeTitle>
        <div
          style={{
            marginBottom: "2em",
            fontSize: "47px",
            textAlign: "center",

            padding: "10px",
          }}
        >
          <div style={{ color: "#354156" }}>Está en mantenimiento</div>
          <div style={{ fontWeight: "bold", color: "#354156" }}>
            Recargando en {timer} segundos
          </div>
        </div>
        <LeniCamel />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
