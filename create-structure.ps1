# create-structure.ps1
# This script creates BitStay folder structure

# Go to E: drive
Set-Location E:\

# Create main project folder
mkdir BitStay
Set-Location BitStay

# Create apps folder with backend & frontend
mkdir apps
Set-Location apps
mkdir backend
mkdir frontend

# Backend structure
Set-Location backend
mkdir src
Set-Location src
mkdir prisma
mkdir modules
mkdir common
mkdir filters
mkdir guards
mkdir interceptors
mkdir dto
mkdir utils

# Frontend structure
Set-Location E:\BitStay\apps\frontend
mkdir src
Set-Location src
mkdir pages
mkdir components
mkdir layouts
mkdir services
mkdir hooks
mkdir utils
mkdir styles
mkdir public
