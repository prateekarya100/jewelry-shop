import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext.jsx";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import Logo from "./Logo.jsx";

export default function Header({ onOpenCart, categories, onSelectCategory }) {
  const { cartCount, notify } = useStore();
  const { isLoggedIn, customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
  const [navOpen, setNavOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);

  const navLinks = categories.slice(0, 5);

  function handleAccountClick(e) {
    if (isLoggedIn) {
      setAccountMenuAnchor(e.currentTarget);
    } else {
      navigate("/account");
    }
  }

  function closeAccountMenu() {
    setAccountMenuAnchor(null);
  }

  function goToAccount() {
    closeAccountMenu();
    navigate("/account");
  }

  function handleAddressesClick() {
    closeAccountMenu();
    navigate("/account?tab=2");
  }

  function handleSignOut() {
    closeAccountMenu();
    logout();
    navigate("/");
  }

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          bgcolor: "primary.main",
          borderBottom: "1px solid",
          borderColor: scrolled ? "rgba(250,241,236,0.14)" : "transparent",
          boxShadow: scrolled ? "0 4px 20px rgba(17,12,20,0.25)" : "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1200,
            mx: "auto",
            width: "100%",
            height: { xs: 64, sm: 78 },
            px: { xs: 1.5, sm: 4 },
          }}
        >
          <Box
            component="button"
            onClick={() => navigate("/")}
            aria-label="Priyasa Fashion — go to homepage"
            sx={{
              mr: { xs: "auto", md: 4 },
              display: "flex",
              minWidth: 0,
              background: "none",
              border: 0,
              p: 0,
              cursor: "pointer",
            }}
          >
            <Logo size={26} wordmarkSize={15} />
          </Box>

          <Stack
            direction="row"
            spacing={3.5}
            sx={{
              flex: 1,
              justifyContent: "center",
              display: { xs: "none", md: "flex" },
            }}
          >
            {navLinks.map((c) => (
              <Button
                key={c}
                onClick={() => onSelectCategory(c)}
                sx={{
                  color: "rgba(250,241,236,0.82)",
                  fontWeight: 500,
                  p: "4px 0",
                  minWidth: "auto",
                  borderRadius: 0,
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    bgcolor: "secondary.main",
                    transform: "scaleX(0)",
                    transition: "transform 0.2s ease",
                  },
                  "&:hover": {
                    color: "primary.contrastText",
                    bgcolor: "transparent",
                    "&::after": { transform: "scaleX(1)" },
                  },
                }}
                disableRipple
              >
                {c}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip
              title={isLoggedIn ? customer?.name || "Your account" : "Sign in"}
            >
              <IconButton
                onClick={handleAccountClick}
                aria-label="Your account"
                sx={{
                  color: "primary.contrastText",
                  display: { xs: "none", md: "inline-flex" },
                }}
              >
                <PersonOutlineRoundedIcon />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={accountMenuAnchor}
              open={!!accountMenuAnchor}
              onClose={closeAccountMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { minWidth: 240, mt: 1 } }}
            >
              <Box sx={{ px: 2, py: 1.25 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>
                  {customer?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer?.email || customer?.phone}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={goToAccount}>
                <ListItemIcon>
                  <ReceiptLongOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>My orders</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleAddressesClick}>
                <ListItemIcon>
                  <PlaceOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Addresses</ListItemText>
              </MenuItem>
              <MenuItem onClick={goToAccount}>
                <ListItemIcon>
                  <ShieldOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Account &amp; security</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut}>
                <ListItemIcon>
                  <LogoutOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sign out</ListItemText>
              </MenuItem>
            </Menu>

            <IconButton
              onClick={onOpenCart}
              aria-label="Open bag"
              sx={{ color: "primary.contrastText" }}
            >
              <Badge
                badgeContent={cartCount}
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                  },
                }}
              >
                <ShoppingBagOutlinedIcon />
              </Badge>
            </IconButton>
            <IconButton
              sx={{
                display: { xs: "inline-flex", md: "none" },
                color: "primary.contrastText",
              }}
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={navOpen} onClose={() => setNavOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }} role="presentation">
          {isLoggedIn && (
            <>
              <Box sx={{ px: 2.5, pb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
                  {customer?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer?.email || customer?.phone}
                </Typography>
              </Box>
              <Divider />
            </>
          )}

          <List
            subheader={
              <Typography
                variant="overline"
                sx={{ pl: 2, color: "text.secondary", fontWeight: 700 }}
              >
                Shop
              </Typography>
            }
          >
            {navLinks.map((c) => (
              <ListItemButton
                key={c}
                onClick={() => {
                  setNavOpen(false);
                  onSelectCategory(c);
                }}
              >
                <ListItemText>{c}</ListItemText>
              </ListItemButton>
            ))}
          </List>

          <Divider />

          <List
            subheader={
              <Typography
                variant="overline"
                sx={{ pl: 2, color: "text.secondary", fontWeight: 700 }}
              >
                Account
              </Typography>
            }
          >
            {isLoggedIn ? (
              <>
                <ListItemButton
                  onClick={() => {
                    setNavOpen(false);
                    goToAccount();
                  }}
                >
                  <ListItemIcon>
                    <ReceiptLongOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>My orders</ListItemText>
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setNavOpen(false);
                    handleAddressesClick();
                  }}
                >
                  <ListItemIcon>
                    <PlaceOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Addresses</ListItemText>
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setNavOpen(false);
                    goToAccount();
                  }}
                >
                  <ListItemIcon>
                    <ShieldOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Account &amp; security</ListItemText>
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setNavOpen(false);
                    handleSignOut();
                  }}
                >
                  <ListItemIcon>
                    <LogoutOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sign out</ListItemText>
                </ListItemButton>
              </>
            ) : (
              <ListItemButton
                onClick={() => {
                  setNavOpen(false);
                  navigate("/account");
                }}
              >
                <ListItemIcon>
                  <PersonOutlineRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sign in</ListItemText>
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
