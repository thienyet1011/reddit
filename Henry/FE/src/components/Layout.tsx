import React, { ReactNode } from "react";
import Container from "./Container";
import Navbar from "./Navbar";

interface ILayoutProps {
    children: ReactNode
}

const Layout = ({children}: ILayoutProps) => {
    return (
        <React.Fragment>
            <Navbar />
            <Container>{children}</Container>
        </React.Fragment>
    )
}

export default Layout;
